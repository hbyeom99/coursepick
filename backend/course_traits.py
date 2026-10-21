"""Versioned, course-level four-axis evidence assessment. No place personality scores."""
import json,math,re
from pathlib import Path
RULES=json.loads(Path(__file__).with_name('course_trait_rules.json').read_text(encoding='utf-8-sig'))
def finite(n):return type(n) in (int,float) and math.isfinite(n)
def axis(value,coverage,reasons=None,assumptions=None):
 reasons=reasons or [];assumptions=assumptions or []
 return {'score':None if value is None else math.floor(max(0,min(100,value))+.5+1e-9),'coverage':math.floor(coverage*100+.5+1e-9)/100,'status':'insufficient' if value is None else 'confirmed' if coverage>=.99 and not assumptions else 'provisional','reasons':reasons,'assumptions':assumptions}
def activity_evidence(p):
 p=p or {};f=p.get('traitFacts') or p.get('trait_facts') or {}
 if finite(f.get('activityIntensity')) and 0<=f['activityIntensity']<=1:return {'intensity':f['activityIntensity'],'participatory':f.get('participatory') if type(f.get('participatory')) is bool else None,'confirmed':True}
 group=next((g for g in RULES['activityGroups'] if any(t in (p.get('tags') or []) for t in g['tags'])),RULES['categoryHints'].get(p.get('category')))
 return {**group,'confirmed':False} if group else None
def duration(e):
 for key in ('minutes','duration_minutes'):
  if finite(e.get(key)) and e[key]>0:return e[key]
 m=re.fullmatch(r'(\d+)분(?: 예상)?',str(e.get('duration','')));return int(m[1]) if m else None
def course_trait_basis(course):
 entries=course.get('schedule') or [];days=max([1,course.get('durationDays') or 0]+[e.get('day',1) for e in entries if type(e.get('day',1)) is int]+[v for v in (course.get('stopDays') or {}).values() if type(v) is int]);return json.dumps([course.get('stopIds') or course.get('place_ids') or [],days,course.get('transport') or '',[[e.get('placeId') or e.get('place_id') or '',e.get('day') or 1,e.get('time') or e.get('start_time') or '',next((e[k] for k in ('minutes','duration_minutes','duration') if e.get(k) is not None),None)] for e in entries]],ensure_ascii=False,separators=(',',':'))
def evaluate_course_traits(course,catalog,context=None):
 context=context or {};index=catalog if isinstance(catalog,dict) else {p['id']:p for p in catalog};ids=course.get('stopIds') or course.get('place_ids') or [];stops=[index.get(p) for p in ids];stored_facts=course.get('traitFacts') or {};facts_stale=bool(stored_facts.get('basis')) and stored_facts['basis']!=course_trait_basis(course);facts={} if facts_stale else stored_facts;entries=course.get('schedule') or [];n=len(ids)
 days=max([1,course.get('durationDays') or 0]+[e.get('day',1) for e in entries if type(e.get('day',1)) is int]+[d for d in (course.get('stopDays') or {}).values() if type(d) is int])
 durations=[]
 for i,pid in enumerate(ids):
  current=entries[i] if i<len(entries) else {};e=current if (current.get('placeId') or current.get('place_id'))==pid else next((e for e in entries if (e.get('placeId') or e.get('place_id'))==pid),current if not any(e.get('placeId') or e.get('place_id') for e in entries) else {});minutes=duration(e);durations.append({'minutes':minutes if minutes is not None else 120,'confirmed':minutes is not None and not e.get('durationEstimated')})
 reasons=[];assumptions=[];features=[];weights=RULES['planningWeights']
 if n:
  features.append((min(100,n/days/8*100),weights['count']));reasons.append('하루 평균 %.1f곳'%(n/days))
  window=facts.get('availableMinutesPerDay') if finite(facts.get('availableMinutesPerDay')) and facts['availableMinutesPerDay']>0 else RULES['defaultDayMinutes'];travel=course.get('estimatedTravelMinutes') if finite(course.get('estimatedTravelMinutes')) and course['estimatedTravelMinutes']>=0 else 0
  density=min(100,(sum(d['minutes'] for d in durations)+travel)/(days*window)*100);q=1 if all(d['confirmed'] for d in durations) and finite(facts.get('availableMinutesPerDay')) else .5;features.append((density,weights['density']*q))
  if q<1:assumptions.append('미확인 체류시간은 120분, 하루 가용시간은 600분을 임시 사용')
  if not finite(course.get('estimatedTravelMinutes')):assumptions.append('이동시간 미확인')
 reservations=[(p.get('traitFacts') or p.get('trait_facts') or {}).get('reservationRequired') for p in stops if p];reservations=[v for v in reservations if type(v) is bool]
 if type(facts.get('reservationRequiredCount')) is int and 0<=facts['reservationRequiredCount']<=n and n:features.append((facts['reservationRequiredCount']/n*100,weights['reservation']));reasons.append('예약 필요 %d곳'%facts['reservationRequiredCount'])
 elif reservations:features.append((sum(reservations)/len(reservations)*100,weights['reservation']*len(reservations)/max(1,n)))
 else:assumptions.append('예약 필요성 미확인')
 if finite(facts.get('fixedOrderRatio')) and 0<=facts['fixedOrderRatio']<=1:features.append((facts['fixedOrderRatio']*100,weights['order']))
 else:assumptions.append('방문 순서 의존도 미확인')
 weight=sum(w for _,w in features);planning=axis(sum(v*w for v,w in features)/weight if weight else None,weight,reasons,assumptions)
 active=participation=known=quality=participation_known=0;total=sum(d['minutes'] for d in durations)
 for p,d in zip(stops,durations):
  a=activity_evidence(p)
  if not a:continue
  m=d['minutes'];active+=m*a['intensity'];known+=m;quality+=m*(1 if a['confirmed'] and d['confirmed'] else .5)
  if type(a.get('participatory')) is bool:participation+=m*int(a['participatory']);participation_known+=m
 experience=axis((active/known*.65+(participation/participation_known*.35 if participation_known else active/known*.35))*100 if known else None,quality/total if total else 0,['활동 분석 가능 %d/%d곳'%(sum(activity_evidence(p) is not None for p in stops),n)],['활동 태그·카테고리 기반 추정 포함; 실내·야외만으로 활동 강도를 결정하지 않음'] if quality<total else [])
 known_ids=set(context.get('knownPlaceIds') or []);known_categories=set(context.get('knownCategories') or []);known_tags=set(context.get('knownTags') or [])
 for pid in known_ids:
  p=index.get(pid) or {}
  if p.get('category'):known_categories.add(p['category'])
  known_tags.update(p.get('tags') or [])
 has_history=bool(known_ids or known_categories);locatable=[p for p in stops if p];novelty=0
 for p in locatable:
  if p['id'] in known_ids:continue
  bits=[(1,.5)];tags=p.get('tags') or []
  if known_categories:bits.append((int(p.get('category') not in known_categories),.35))
  if known_tags and tags:bits.append((sum(t not in known_tags for t in tags)/len(tags),.15))
  novelty+=sum(v*w for v,w in bits)/sum(w for _,w in bits)
 exploration=axis(novelty/len(locatable)*100 if has_history and locatable else None,len(locatable)/n if n else 0,['이전 선택·방문 기록과 코스 구성을 비교' if has_history else '사용자 이력이 있어야 계산 가능'],[] if has_history else ['개인화 전에는 코스 고정 탐색 점수를 부여하지 않음'])
 daily=None;coverage=0;cost_reasons=[];cost_assumptions=[]
 if finite(facts.get('estimatedDailyCost')) and facts['estimatedDailyCost']>=0:daily=facts['estimatedDailyCost'];coverage=.75;cost_reasons=['사용자 입력 1인 하루 예상 비용'];cost_assumptions=['예상 비용이며 실제 정산액과 구분']
 else:
  cost_stops=[p for p in stops if (p or {}).get('category') not in ('숙소','숙박')];cost_n=len(cost_stops);costs=[((p or {}).get('traitFacts') or (p or {}).get('trait_facts') or {}).get('costPerPerson') for p in cost_stops];known_costs=[v for v in costs if finite(v) and v>=0];transit=0 if course.get('transport')=='도보' else facts.get('localTransportCostTotal');coverage=(len(known_costs)+int(finite(transit) and transit>=0))/(cost_n+1) if cost_n else 0
  if cost_n and len(known_costs)==cost_n and finite(transit) and transit>=0:daily=(sum(known_costs)+transit)/days;cost_reasons=['장소별 1인 비용과 지역 내 이동비 합산']
  else:cost_assumptions=['식비·카페·입장·체험·지역 내 이동비 중 미확인 항목 있음']
 spending=axis(next(b['score'] for b in RULES['spendingBands'] if b['max'] is None or daily<=b['max']) if daily is not None else None,coverage,cost_reasons,cost_assumptions)
 if facts_stale:
  for value in (planning,experience,exploration,spending):
   value['assumptions'].append('코스 구성 변경: 입력한 계산 근거를 다시 확인해 주세요')
   if value['score'] is not None:value['status']='provisional'
 return {'factsStale':facts_stale,'version':RULES['version'],'axes':dict(planning=planning,experience=experience,exploration=exploration,spending=spending),'dailyCost':daily,'costScope':RULES['costScope'],'days':days,'stopCount':n}
def course_trait_affinity(assessment,taste):
 return sum((1-abs(taste[a]-assessment['axes'][a]['score'])/100)*assessment['axes'][a]['coverage'] for a in RULES['axes'] if finite(taste.get(a)) and assessment['axes'][a]['score'] is not None)/4 if taste else 0

def validate_trait_facts(value):
 if value is None:return None
 if not isinstance(value,dict):raise ValueError('코스 성향 근거 형식')
 result={}
 if 'basis' in value:
  if not isinstance(value['basis'],str) or len(value['basis'])>100000:raise ValueError('코스 식별 정보')
  result['basis']=value['basis']
 for k,lo,hi in [('availableMinutesPerDay',1,1440),('reservationRequiredCount',0,100),('fixedOrderRatio',0,1),('estimatedDailyCost',0,999999999),('localTransportCostTotal',0,999999999)]:
  if k not in value:continue
  if not finite(value[k]) or not lo<=value[k]<=hi or (k!='fixedOrderRatio' and type(value[k]) is not int):raise ValueError('코스 성향 근거 값')
  result[k]=value[k]
 return result
