from tourapi_rate_limit import admit_tourapi_call,TourApiLimitError
from tag_features import feature_evidence
"""Resumable TourAPI collection. No keys, invented ratings, or synthetic places in exports."""
import argparse
import csv
import hashlib
import html
import json
import math
import re
import sqlite3
import time
import urllib.error
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path
from dotenv import dotenv_values
from supabase import create_client

REGION_NAMES = {'1':'서울','2':'인천','3':'대전','4':'대구','5':'광주광역시','6':'부산','7':'울산','8':'세종',
                '31':'경기','32':'강원','33':'충북','34':'충남','35':'경북','36':'경남','37':'전북','38':'전남','39':'제주'}
BUCKETS = ['관광지','음식점','카페','체험']
BASE = 'https://apis.data.go.kr/B551011/KorService2/'
class CollectionError(Exception): pass
class QuotaError(CollectionError): pass
def clean(value):
    return re.sub(r'\s+', ' ', html.unescape(re.sub('<[^>]*>', ' ', str(value or '')))).strip()
def records(body):
    items = body.get('items') or {}
    rows = items.get('item', []) if isinstance(items,dict) else []
    return rows if isinstance(rows,list) else [rows]

class Collector:
    def __init__(self, folder):
        self.folder=folder; folder.mkdir(parents=True,exist_ok=True)
        self.config=dotenv_values(Path(__file__).with_name('.env'),interpolate=False)
        self.key=urllib.parse.unquote(self.config.get('TOUR_API_SERVICE_KEY',''))
        if not self.key: raise CollectionError('TourAPI 서버 키가 설정되지 않았습니다.')
        self.db=sqlite3.connect(folder/'collection.sqlite3')
        self.db.executescript('''create table if not exists cache (key text primary key, body text not null);
        create table if not exists reviewed (id text primary key, region text, bucket text, place text, evidence text);
        create table if not exists skipped (id text primary key, reason text);
        create table if not exists totals (region text, type integer, total integer, primary key(region,type));''')
        self.calls=0; self.last=0
    def call(self, method, **values):
        params=dict(MobileOS='ETC',MobileApp='coursepick',_type='json',numOfRows=1000,pageNo=1)
        params.update(values)
        cachekey=method+':'+json.dumps(params,sort_keys=True)
        cached=self.db.execute('select body from cache where key=?',(cachekey,)).fetchone()
        if cached: return json.loads(cached[0])
        params['serviceKey']=self.key
        for attempt in range(4):
            time.sleep(max(0,.25-(time.monotonic()-self.last)))
            try:admit_tourapi_call('collector')
            except TourApiLimitError as error:
                raise QuotaError(str(error)) from None
            self.calls+=1; self.last=time.monotonic()
            try:
                with urllib.request.urlopen(BASE+method+'?'+urllib.parse.urlencode(params),timeout=30) as response:
                    payload=response.read()
                try:
                    data=json.loads(payload)
                    header=data.get('response',{}).get('header',{})
                    code=str(header.get('resultCode',''))
                    body=data.get('response',{}).get('body',{})
                except (ValueError,KeyError):
                    root=ET.fromstring(payload)
                    code=root.findtext('.//returnReasonCode') or root.findtext('.//resultCode') or ''
                    message=root.findtext('.//returnAuthMsg') or ''
                    if 'LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS' in message: code='22'
                    body={}
                if code=='22': raise QuotaError('TourAPI 일일 호출 한도 초과(22). 진행 상태를 저장했습니다.')
                if code in ['0000','00']:
                    self.db.execute('insert or replace into cache values (?,?)',(cachekey,json.dumps(body,ensure_ascii=False))); self.db.commit()
                    return body
                if code in ['20','30','31']: raise CollectionError('TourAPI 인증·이용 설정 오류('+code+').')
                if code=='23': time.sleep(3*(attempt+1)); continue
                raise CollectionError('TourAPI 응답 오류('+code+').')
            except QuotaError: raise
            except (urllib.error.URLError,TimeoutError,ValueError,ET.ParseError,CollectionError) as error:
                if isinstance(error,urllib.error.HTTPError):
                    (self.folder/'last-http-error.json').write_text(json.dumps(dict(method=method,parameters=values,httpStatus=error.code)),encoding='utf-8')
                    if error.code==429 and attempt==3: raise QuotaError('TourAPI 호출 제한(HTTP 429). 제한 해제 후 재개할 수 있습니다.') from None
                if attempt==3: raise CollectionError(str(error) if isinstance(error,CollectionError) else 'TourAPI 요청 실패: '+type(error).__name__+(' (HTTP '+str(error.code)+')' if isinstance(error,urllib.error.HTTPError) else '')) from None
                time.sleep(2*(attempt+1))
        raise CollectionError('TourAPI 초당 호출 제한으로 중단했습니다.')
    def lists(self, code, type):
        page=1; result=[]
        while True:
            body=self.call('areaBasedList2',areaCode=code,contentTypeId=type,pageNo=page,arrange='Q')
            rows=records(body); total=int(body.get('totalCount',0))
            self.db.execute('insert or replace into totals values (?,?,?)',(REGION_NAMES[code],type,total));self.db.commit()
            result.extend(rows)
            if not rows or len(result)>=total: return result
            page+=1
    def classify(self,p):
        type=str(p['contenttypeid']); code=p.get('cat3',''); name=clean(p['title'])
        if type=='39':
            if code=='A05020900' or any(w in name for w in ['카페','커피','베이커리','찻집','제과','디저트']): return '카페'
            return '음식점'
        if type=='28' and p.get('cat2')!='A0301': return '체험'
        if type in ['12','14'] and any(w in name for w in ['체험','공방','농장','양조장','방탈출','보드게임','인터랙티브','인터렉티브']): return '체험'
        if type in ['12','14']: return '관광지'
        return None
    def enrich(self,p,region,bucket):
        id='tourapi_'+str(p['contentid'])
        try: lat=float(p.get('mapy',0)); lon=float(p.get('mapx',0))
        except (TypeError,ValueError): return None,'좌표 형식 오류'
        if not math.isfinite(lat) or not math.isfinite(lon) or not (32.5<lat<39.5 and 124<lon<132): return None,'좌표 누락·국내 범위 밖'
        if not p.get('firstimage'): return None,'대표 이미지 누락'
        common=records(self.call('detailCommon2',contentId=p['contentid']))
        if not common: return None,'공통 상세정보 누락'
        common=common[0]; license=common.get('cpyrhtDivCd') or p.get('cpyrhtDivCd')
        if license not in ['Type1','Type3']: return None,'이미지 이용조건 미확인'
        overview=clean(common.get('overview'))
        if not overview: return None,'장소 설명 누락'
        intro=records(self.call('detailIntro2',contentId=p['contentid'],contentTypeId=p['contenttypeid']))
        intro=intro[0] if intro else {}
        menu=clean(intro.get('firstmenu'))+' '+clean(intro.get('treatmenu'))
        text=clean(p['title'])+' '+overview
        tags=[]; proof={}
        def add(tag,basis):
            if tag not in tags: tags.append(tag); proof[tag]=basis
        if bucket=='관광지': add('관람','TourAPI 관광지·문화시설 분류')
        if bucket=='음식점':
            add('미식','TourAPI 음식점 분류')
            for tag,words in {'한식':['한식','국밥','갈비','비빔밥','백반','찌개','한정식','삼겹','냉면','곰탕','오리','보쌈'],
                              '일식':['일식','초밥','우동','라멘','사시미','스시','돈까스','돈가스'],
                              '중식':['중식','짜장','짬뽕','탕수육','마라'],
                              '양식':['양식','파스타','피자','리조또','스테이크','버거','샌드위치']}.items():
                if any(w in menu for w in words): add(tag,'대표·취급 메뉴')
            if len(tags)==1: add('기타음식','음식점 분류, 세부 메뉴 유형 미확인')
        if bucket=='카페':
            add('휴식','카페·찻집·제과 분류')
            if any(w in text+' '+menu for w in ['커피','카페','아메리카노','라떼']): add('커피','장소명·메뉴·설명')
            if any(w in clean(p['title'])+' '+menu for w in ['베이커리','빵','제과']): add('빵','장소명·메뉴')
            if any(w in clean(p['title'])+' '+menu for w in ['디저트','케이크','빙수','마카롱','모찌','빵','베이커리']): add('디저트','장소명·메뉴')
        if bucket=='체험':
            if str(p['contenttypeid'])=='28': add('액티비티','TourAPI 레포츠 분류')
            else: add('체험','체험·공방·농장 등 장소명')
        for tag,words in {'자연':['자연','숲','계곡','수목원','산림'],'숲':['숲','산림'],'바다':['해변','해수욕장','바다','해안'],
                          '산책':['산책','산책로','둘레길'],'전망':['전망대','전망을'],'한옥':['한옥'],'역사문화':['유적','문화재','박물관','역사'],
                          '건축':['건축'],'관람':['관람','전시'],'야경':['야경'],'힐링':['힐링'],
                          '야외':['야외','캠핑','야영','공원','등산'],'실내':['실내'],'캠핑':['캠핑','야영'],'글램핑':['글램핑'],
                          '양조장':['양조장'],'전통주':['전통주'],'막걸리':['막걸리'],'시음':['시음'],
                          '포토':['포토존','사진 촬영','사진촬영'],'쇼핑':['쇼핑']}.items():
            word=feature_evidence(text,tag,words)
            if word: add(tag,'TourAPI 장소명·설명: '+word)
        if any(t in tags for t in ['양조장','전통주','막걸리','시음']): add('주캉스','전통주·양조 관련 명시 정보')
        hours=clean(intro.get('opentimefood') or intro.get('usetime') or intro.get('usetimeculture') or intro.get('usetimeleports'))
        row=dict(id=id,name=clean(p['title']),category='관광지' if bucket=='체험' else bucket,region=region,
                 location=clean(str(p.get('addr1',''))+' '+str(p.get('addr2',''))),description=overview,tags=tags,image_url=p['firstimage'],
                 latitude=lat,longitude=lon,opening_hours=hours,rating=0)
        if not row['location']: return None,'주소 누락'
        evidence=dict(source='TourAPI',contentId=str(p['contentid']),contentTypeId=str(p['contenttypeid']),cat3=p.get('cat3'),
                      areaCode=str(p.get('areacode')),imageLicense=license,imageSource=row['image_url'],modifiedAt=p.get('modifiedtime'),
                      menu=menu.strip(),tagEvidence=proof,notes=['평점 미제공: 0은 미평가']+(['운영시간 미제공'] if not hours else []))
        return (row,evidence),None
    def export(self,status):
        rows=[dict(region=r,bucket=b,place=json.loads(p),evidence=json.loads(e)) for r,b,p,e in self.db.execute('select region,bucket,place,evidence from reviewed order by region,bucket,id')]
        counts={region:{b:0 for b in BUCKETS} for region in REGION_NAMES.values()}
        for row in rows: counts[row['region']][row['bucket']]+=1
        report=dict(status=status,reviewed=len(rows),callsThisRun=self.calls,counts=counts,quotaPerBucket=300,
                    skipped=dict(self.db.execute('select reason,count(*) from skipped group by reason')),
                    totals=[dict(region=r,contentTypeId=t,total=n) for r,t,n in self.db.execute('select * from totals')])
        (self.folder/'review.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
        (self.folder/'progress.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
        with (self.folder/'places.csv').open('w',encoding='utf-8-sig',newline='') as f:
            fields=['id','name','category','region','location','description','tags','image_url','latitude','longitude','opening_hours','rating']
            writer=csv.DictWriter(f,fieldnames=fields); writer.writeheader()
            for row in rows:
                place=dict(row['place']);place['tags']='{'+','.join('"'+t.replace('"','\\"')+'"' for t in place['tags'])+'}';writer.writerow(place)
        return report
    def client(self): return create_client(self.config['SUPABASE_URL'],self.config['SUPABASE_SERVICE_KEY'])
    def existing(self):
        db=self.client(); rows=[]
        while True:
            page=db.table('places').select('*').order('id').range(len(rows),len(rows)+999).execute().data
            rows.extend(page)
            if len(page)<1000:return rows
    def collect(self):
        old=self.existing()
        if not (self.folder/'places-before.json').exists(): (self.folder/'places-before.json').write_text(json.dumps(old,ensure_ascii=False),encoding='utf-8')
        existing={p['id'] for p in old}; identities={(p['name'],p['location']) for p in old}
        regions=records(self.call('areaCode2'))
        pools={}
        for region in regions:
            code=str(region['code']);name=REGION_NAMES.get(code)
            if not name:continue
            pools[name]={b:[] for b in BUCKETS}
            for type in [12,39,28,14]:
                rows=self.lists(code,type)
                for p in rows:
                    bucket=self.classify(p)
                    if bucket: pools[name][bucket].append(p)
            print(json.dumps(dict(stage='목록 조회',region=name,candidates={b:len(v) for b,v in pools[name].items()}),ensure_ascii=False),flush=True)
            self.export('목록 수집 중')
        # Round-robin small batches prevent one region from consuming the whole day's quota.
        checked={r[0] for r in self.db.execute('select id from reviewed union select id from skipped')}
        identities.update((json.loads(p)['name'],json.loads(p)['location']) for p, in self.db.execute('select place from reviewed'))
        counts={(r,b):n for r,b,n in self.db.execute('select region,bucket,count(*) from reviewed group by region,bucket')}
        positions={(r,b):0 for r in pools for b in BUCKETS}
        pending=True
        while pending:
            pending=False
            for region,groups in pools.items():
                for bucket,candidates in groups.items():
                    key=(region,bucket)
                    if counts.get(key,0)>=300:continue
                    attempts=0
                    while positions[key]<len(candidates) and attempts<2 and counts.get(key,0)<300:
                        p=candidates[positions[key]];positions[key]+=1;id='tourapi_'+str(p['contentid'])
                        if id in checked or id in existing:continue
                        attempts+=1
                        identity=(clean(p['title']),clean(str(p.get('addr1',''))+' '+str(p.get('addr2',''))))
                        if identity in identities: result,reason=None,'기존·수집 장소 이름/주소 중복'
                        else: result,reason=self.enrich(p,region,bucket)
                        if result:
                            place,evidence=result
                            self.db.execute('insert or ignore into reviewed values (?,?,?,?,?)',(id,region,bucket,json.dumps(place,ensure_ascii=False),json.dumps(evidence,ensure_ascii=False)))
                            counts[key]=counts.get(key,0)+1;identities.add(identity)
                        else:self.db.execute('insert or replace into skipped values (?,?)',(id,reason))
                        self.db.commit();checked.add(id)
                    if positions[key]<len(candidates) and counts.get(key,0)<300:pending=True
            report=self.export('상세정보 수집 중')
            print(json.dumps(dict(stage='상세 검토',reviewed=report['reviewed'],calls=self.calls),ensure_ascii=False),flush=True)
        return self.export('수집 완료: 지역별 미달 수량은 progress.json 확인')
    def store(self):
        rows=[json.loads(p) for p, in self.db.execute('select place from reviewed order by id')]
        before=self.existing(); ids={p['id'] for p in before}; names={(p['name'],p['location']) for p in before}
        fresh=[p for p in rows if p['id'] not in ids and (p['name'],p['location']) not in names]
        client=self.client()
        for start in range(0,len(fresh),100):client.table('places').upsert(fresh[start:start+100],on_conflict='id',ignore_duplicates=True).execute()
        after=self.existing(); actual={p['id']:p for p in after}
        assert all(actual.get(p['id'])==p for p in before),'기존 데이터 변경 감지'
        assert all(all(actual[p['id']].get(k)==v for k,v in p.items()) for p in fresh),'저장 검증 실패'
        baseline=json.loads((self.folder/'places-before.json').read_text(encoding='utf-8')) if (self.folder/'places-before.json').exists() else before
        baseline_ids={p['id'] for p in baseline}
        result=dict(inserted=len(fresh),cumulativeInserted=sum(p['id'] not in baseline_ids and p['id'] in actual for p in rows),reviewed=len(rows),total=len(after),existingUnchanged=True)
        (self.folder/'import-result.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
        return result

def main():
    parser=argparse.ArgumentParser();parser.add_argument('action',choices=['collect','store','status']);parser.add_argument('--output',type=Path,required=True)
    args=parser.parse_args(); collector=Collector(args.output)
    try:
        result=collector.collect() if args.action=='collect' else collector.store() if args.action=='store' else collector.export('상태 확인')
        print(json.dumps(result,ensure_ascii=False),flush=True)
    except QuotaError as error:
        result=collector.export(str(error));print(json.dumps(result,ensure_ascii=False),flush=True)
        raise SystemExit(22)
    except Exception as error:
        collector.export('중단: '+type(error).__name__)
        print('처리를 중단했습니다: '+(str(error) if isinstance(error,CollectionError) else type(error).__name__)+'. 키·요청 URL은 로그에 출력하지 않았습니다.',flush=True)
        raise SystemExit(1)
if __name__=='__main__':main()
