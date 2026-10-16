"""Conservative, place-owned opening-time normalization. No course data or LLM.
Dry run writes a full source snapshot and review report. --apply requires the SQL migration.
"""
import argparse,csv,hashlib,json,re
from datetime import datetime,timezone
from pathlib import Path
from dotenv import dotenv_values
from supabase import create_client
VERSION='opening-v2'
DAYS=list('월화수목금토일')
RANGE=re.compile(r'(?<![\d:])(\d{1,2}):([0-5]\d)\s*(?:~|～|〜|－|–|—|-)\s*(\d{1,2}):([0-5]\d)(?!\d)')
def normalize_base(text):
 raw=str(text or '').strip()
 result=dict(original_text=str(text or ''),opening_time=None,explicit_weekdays=None,status='review_pending',review_reason='',evidence='',normalization_version=VERSION,source_hash=hashlib.sha256(str(text or '').encode()).hexdigest())
 def pending(reason):result['review_reason']=reason;return result
 if not raw:return pending('운영시간 원문 없음')
 if re.search(r'확인\s*필요|문의|예약|변동|상이|유동|일몰|일출',raw):return pending('예약·변동·확인 안내가 있어 검토 필요')
 if re.search(r'24시간|상시',raw):return pending('상시 운영 표현만 확인됨 — 시작 시각을 임의 생성하지 않음')
 ranges=list(RANGE.finditer(raw))
 if not ranges:return pending('시작·종료 구간이 명확하지 않음')
 if any(int(m[1])>23 or int(m[3])>24 or (int(m[3])==24 and m[4]!='00') for m in ranges):return pending('시각 범위 검토 필요')
 if re.search(r'브레이크|휴게|입장|마감|라스트|오더|점심|저녁|동절|하절|성수|비수|계절|토요일|일요일|평일|주말|공휴일|\d{1,2}월|\d{4}-\d{2}',raw):return pending('날짜·요일별 상이 시간 또는 휴게·마감 정보 검토 필요')
 if len(ranges)!=1:return pending('복수 운영구간 — 단일 시작 시각으로 확정하지 않음')
 m=ranges[0]
 # Reject additional numeric time-like expressions outside the matched interval.
 outside=raw[:m.start()]+raw[m.end():]
 if re.search(r'\d',outside):return pending('추가 숫자·조건이 있어 검토 필요')
 result['opening_time']=f'{int(m[1]):02d}:{m[2]}'
 result['evidence']=m.group(0)
 if re.search(r'매일|월\s*[~～-]\s*일',raw):result['explicit_weekdays']=DAYS
 else:
  days=re.search(r'([월화수목금토일])\s*[~～-]\s*([월화수목금토일])',outside)
  if days:
   start,end=map(DAYS.index,days.groups())
   if start>end:return pending('요일 범위 순서 검토 필요')
   result['explicit_weekdays']=DAYS[start:end+1]
  else:return pending('시작 시각은 추출했으나 적용 요일 미확인')
 # Explicit closure days are retained only when outside the stated opening days.
 closed=re.findall(r'(?:매주\s*)?([월화수목금토일])요일',outside)
 if any(day in result['explicit_weekdays'] for day in closed):return pending('운영 요일과 휴무 표현 충돌')
 result['status']='normalized';return result


def opening_candidates(text):
 raw=str(text or '')
 candidates=[]
 for m in RANGE.finditer(raw):
  if int(m[1])>23 or int(m[3])>24 or (int(m[3])==24 and m[4]!='00'):continue
  # Keep the literal context, never invent weekdays or a date.
  boundary=max(raw.rfind(sep,0,m.start()) for sep in ['/',';','\n','|'])
  prefix=raw[boundary+1:m.start()].strip()
  previous=list(RANGE.finditer(prefix))
  if previous:prefix=prefix[previous[-1].end():].strip()
  evidence=raw[boundary+1:m.end()].strip()
  if re.search(r'브레이크|휴게|휴식시간',prefix):
   kind='break_start'
  elif re.search(r'입장|매표|라스트|오더|마감',prefix):kind='admission_or_order_window'
  elif re.search(r'휴무|이용불가|운영하지|미운영',prefix):kind='unavailable_window'
  else:kind='opening_start'
  candidates.append({'time':f'{int(m[1]):02d}:{m[2]}','kind':kind,'condition_text':prefix or None,'evidence':evidence,'status':'review_pending'})
  if kind=='break_start':
   candidates.append({'time':f'{int(m[3]):02d}:{m[4]}','kind':'break_end','condition_text':prefix or None,'evidence':evidence,'status':'review_pending'})
 # Accept a standalone time only when explicitly labelled as an opening time.
 for m in re.finditer(r'(?:운영\s*시작|영업\s*시작|개장|오픈)\s*[:：]?\s*([0-2]?\d):([0-5]\d)',raw):
  if int(m[1])>23:continue
  item={'time':f'{int(m[1]):02d}:{m[2]}','kind':'opening_start','condition_text':None,'evidence':m.group(0),'status':'review_pending'}
  if not any(c['time']==item['time'] and c['kind']==item['kind'] for c in candidates):candidates.append(item)
 return candidates

def normalize(text):
 result=normalize_base(text)
 result['opening_candidates']=opening_candidates(text) if result['status']=='review_pending' else []
 return result

def run():
 parser=argparse.ArgumentParser();parser.add_argument('--output',required=True);parser.add_argument('--apply',action='store_true');args=parser.parse_args()
 config=dotenv_values(Path(__file__).with_name('.env'),interpolate=False)
 client=create_client(config['SUPABASE_URL'],config['SUPABASE_SERVICE_KEY'])
 rows=[]
 while True:
  part=client.table('places').select('id,name,opening_hours').order('id').range(len(rows),len(rows)+999).execute().data
  rows.extend(part)
  if len(part)<1000:break
 out=Path(args.output);out.mkdir(parents=True,exist_ok=True)
 stamp=datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S')
 (out/f'opening-hours-source-{stamp}.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2),encoding='utf-8')
 normalized=[dict(place_id=r['id'],**normalize(r.get('opening_hours'))) for r in rows]
 (out/'normalized-opening-times.json').write_text(json.dumps(normalized,ensure_ascii=False,indent=2),encoding='utf-8')
 with (out/'운영시작시간_검토목록.csv').open('w',encoding='utf-8-sig',newline='') as file:
  writer=csv.writer(file);writer.writerow(['장소ID','장소명','원문','시작시간','명시된운영요일','상태','검토사유','시작시간후보_JSON'])
  for source,item in zip(rows,normalized):writer.writerow([source['id'],source['name'],item['original_text'],item['opening_time'],json.dumps(item['explicit_weekdays'],ensure_ascii=False),item['status'],item['review_reason'],json.dumps(item['opening_candidates'],ensure_ascii=False)])
 if args.apply:
  # Missing table fails safely; do not fall back to overwriting original text.
  client.table('place_opening_times').select('place_id').limit(1).execute()
  for offset in range(0,len(normalized),200):client.table('place_opening_times').upsert(normalized[offset:offset+200],on_conflict='place_id').execute()
 print(json.dumps({'places':len(rows),'normalized':sum(x['status']=='normalized' for x in normalized),'review_pending':sum(x['status']=='review_pending' for x in normalized),'applied':args.apply},ensure_ascii=False))
if __name__=='__main__':run()
