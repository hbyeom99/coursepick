"""Read-only image reconciliation against TourAPI records already in places."""
import sys,json,re,math,unicodedata
from pathlib import Path
from collections import defaultdict,Counter
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
from place_queries import place_client
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'outputs'/'tourapi-image-matching';OUT.mkdir(parents=True,exist_ok=True)
def norm(s):return re.sub(r'[^가-힣a-z0-9]','',unicodedata.normalize('NFKC',str(s or '')).lower())
def addr(s):
 s=str(s or '')
 for a,b in [('서울특별시','서울'),('부산광역시','부산'),('광주광역시','광주'),('인천광역시','인천'),('대구광역시','대구'),('대전광역시','대전'),('울산광역시','울산'),('경기도','경기'),('강원특별자치도','강원'),('전북특별자치도','전북'),('충청남도','충남'),('충청북도','충북'),('전라남도','전남'),('전라북도','전북'),('경상북도','경북'),('경상남도','경남'),('제주특별자치도','제주')]:s=s.replace(a,b)
 return norm(s)
def photo(s):
 s=str(s or '').strip()
 return bool(s and not re.search(r'data:|placeholder|no[-_ ]?image|사진\s*없음|coursepick[-_](logo|splash)|profile[-_]',s,re.I) and s.startswith(('http://','https://','/')))
def dist(a,b):
 try:
  x,y,u,v=[float(z) for z in [a['latitude'],a['longitude'],b['latitude'],b['longitude']]]
  if not(33<=x<=39 and 124<=y<=132 and 33<=u<=39 and 124<=v<=132):return None
  z=math.sin(math.radians(u-x)/2)**2+math.cos(math.radians(x))*math.cos(math.radians(u))*math.sin(math.radians(v-y)/2)**2
  return 6371000*2*math.asin(min(1,math.sqrt(z)))
 except (TypeError,KeyError,ValueError):return None
client=place_client();rows=[];offset=0
while True:
 batch=client.table('places').select('id,name,region,category,location,image_url,latitude,longitude,lodging_info').order('id').range(offset,offset+999).execute().data
 rows+=batch;offset+=len(batch)
 if len(batch)<1000:break
sources=[p for p in rows if p['id'].startswith('tourapi_') and photo(p.get('image_url'))]
targets=[p for p in rows if not photo(p.get('image_url')) and not p['id'].startswith('test-') and not re.fullmatch(r'p\d+',p['id'])]
byname=defaultdict(list)
for p in sources:byname[norm(p['name'])].append(p)
confirmed=[];review=[];unmatched=[]
for p in targets:
 candidates=[]
 for s in byname.get(norm(p['name']),[]):
  if s['id']==p['id']:continue
  d=dist(p,s);a,b=addr(p.get('location')),addr(s.get('location'));sameaddr=bool(a and b and a==b)
  evidence=[]
  if sameaddr:evidence.append('장소명·주소 일치')
  if d is not None and d<=80:evidence.append('장소명 일치·좌표 80m 이내')
  candidates.append(dict(sourceId=s['id'],sourceName=s['name'],sourceAddress=s.get('location'),image=s['image_url'],distanceMeters=round(d,1) if d is not None else None,evidence=evidence,imageLicense=(s.get('lodging_info') or {}).get('imageLicense','미기록')))
 good=[c for c in candidates if c['evidence']]
 item=dict(id=p['id'],name=p['name'],region=p.get('region'),category=p.get('category'),address=p.get('location'),candidates=good or candidates)
 if len(good)==1:confirmed.append(item)
 elif candidates:review.append(item)
 else:unmatched.append({'id':p['id'],'name':p['name'],'region':p.get('region'),'category':p.get('category')})
result=dict(total=len(rows),tourapiRows=sum(p['id'].startswith('tourapi_') for p in rows),tourapiImageSources=len(sources),missingImageTargets=len(targets),identityMatched=len(confirmed),needsReview=len(review),unmatched=len(unmatched),tourapiCalls=0,dbWrites=0,confirmed=confirmed,review=review,remaining=unmatched)
# Existing report is overwritten only with the new read-only comparison, never DB content.
(OUT/'comparison.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps({k:v for k,v in result.items() if k not in ('confirmed','review','remaining')},ensure_ascii=True))
