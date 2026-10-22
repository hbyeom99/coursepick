"""Allow-listed tags from literal provider classification; no query/name inference."""
import json,re,unicodedata
from pathlib import Path
ROOT=Path(__file__).resolve().parent
GROUPS=json.loads((ROOT/'home_search_keywords.json').read_text(encoding='utf-8'))
def key(value):return re.sub(r'\s+','',unicodedata.normalize('NFKC',str(value)).lower().lstrip('#'))
ALLOWED={key(word):word for words in GROUPS.values() for word in words}
RELATIONS=json.loads((ROOT/'approved_search_relations.json').read_text(encoding='utf-8'))
# Descriptive, subjective and conditional words are never inferred from business names.
CONDITIONAL=re.compile(r'무료|주차|예약|동반|수유|엘리베이터|유아의자|좌석|24시간|연중무휴|웨이팅|키즈존|감성|힐링|가성비|저예산|저렴|맛집|예쁜|분위기|느낌|느좋|예카|숨은|핫플|조용|한적|낭만|아늑|따뜻|차분|잔잔|이국|빈티지|레트로|소박|신나는|특별|색다른|이색|독특|아름다운|탁트인|비밀')
def classify_allowed_tags(place):
 evidence=[]
 # Exact provider category segments only. '보관,저장' cannot become '여행 장소'.
 segments=[part.strip() for part in re.split(r'[>,/]',str(place.get('categoryPath') or place.get('category_path') or '')) if part.strip()]
 category=str(place.get('category') or '')
 if category in ('카페','관광','체험','숙소'):segments.append(category)
 for segment in segments:
  k=key(segment)
  if k in ALLOWED and not CONDITIONAL.search(k):evidence.append((ALLOWED[k],'원문 분류: '+segment))
 # Existing explicit tags are preserved and may justify approved parent tags.
 existing=place.get('tags') or []
 keys={key(t) for t in existing}|{key(t) for t,_ in evidence}
 for parent,children in RELATIONS['children'].items():
  if any(key(c) in keys for c in children):evidence.append((parent,'승인된 하위태그'))
 for group in RELATIONS['aliases']:
  if any(key(c) in keys for c in group):
   for word in group:evidence.append((word,'승인된 동의어'))
 out=[];seen=set()
 for tag,reason in evidence:
  k=key(tag)
  if k in ALLOWED and k not in seen:seen.add(k);out.append({'tag':ALLOWED[k],'reason':reason})
 return out
