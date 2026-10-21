"""Human-readable persona titles grounded in existing course/place metadata."""
import hashlib,re
BROAD={'문화','여가','분석','레저','체육','공원','문화여가','스포츠관광','체육시설정보','레저스포츠','액티비티','지역명소','생활체육','웰니스관광','공공인프라','지역별 해수욕장','소개','개장','지리정보','관광','피서','테마파크주소','레저스포츠시설','지역별테마파크','유명 식당레스토랑','실내','야외','체험','관람','자연','휴식','여유','활동','한식','일식','양식','중식','기타음식'}
SKIP={'분석','체육시설정보','공공인프라','소개','개장','지리정보','테마파크주소','분류미확인','예약확인필요','운영시간확인필요'}
GROUPS=[{'맥주','수제맥주','브루어리','양조장','펍','시음','주캉스','로컬맥주','테이스팅'}, {'커피','카페','디저트','빵'}, {'산책','걷기','산책로','둘레길','트레킹'}, {'야영','캠핑','글램핑'}, {'미식','맛집','먹방','한식','고기구이','돼지고기','돈가스','식사'}]
def particle(word,a,b):
 c=ord(word[-1]) if word else 0
 jong=(c-0xAC00)%28 if 0xAC00<=c<=0xD7A3 else 0
 return b if a=='으로' and jong==8 else a if jong else b

def keyword_group(word):
 return next((str(i) for i,g in enumerate(GROUPS) if word in g),word)

def title_candidates(course,places):
 stops=[places[i] for i in course['place_ids'] if i in places]
 tags=list(dict.fromkeys([*(course.get('tags') or []),*(t for p in stops for t in p.get('tags') or [])]))
 original=next((t for t in course.get('tags') or [] if isinstance(t,str) and t not in SKIP),'')
 concrete=[t for t in tags if isinstance(t,str) and 1<len(t)<=10 and t not in BROAD and t not in SKIP and not any(x in t for x in ['확인','동반','주차','화장실','예약','유모차','수유','장애','휠체어','편의','유아','아동','정보','시설','제공','가능','불가'])]
 primary=original if original and (original not in BROAD or original in {'자연','휴식','여유','실내','야외','관람','공원','액티비티','문화','체험'}) and len(original)<=12 else next(iter(concrete),original or '나들이')
 if primary in ('실내','야외'):primary+=' 나들이'
 secondary=next((t for t in concrete if keyword_group(t)!=keyword_group(primary)),None)
 if secondary is None and any(p.get('category')=='음식점' for p in stops) and keyword_group(primary)!='4':secondary='맛있는 한 끼'
 secondary=secondary or next((t for t in tags if t in ('산책','관람','휴식') and t!=primary),None)
 region=course['region']
 old=re.sub(r'^.+?의\s+','',course['title'])
 prefix=old.split(original)[0].strip() if original and original in old else ''
 if prefix.startswith(region) and len(prefix)<=18:area=prefix
 else:
  location=stops[0].get('location','') if stops else ''
  sub=next((v for v in location.split() if re.fullmatch(r'[가-힣]+[군구시]',v) and not v.endswith(('광역시','특별시'))), '')
  area=region+(' '+sub if sub and sub!=region+'시' else '')
 if area.startswith(('경기 ','강원 ','충북 ','충남 ','전북 ','전남 ','경북 ','경남 ')):area=' '.join(area.split()[1:])
 day='하루' if course.get('duration_days',1)==1 else '여행'
 venue=re.sub(r'\[[^]]*\]|\([^)]*\)','',stops[0]['name']).strip() if stops else area
 venue=venue if len(venue)<=16 else venue[:16].rstrip()
 variants=[f'{area}, 오늘은 {primary}',f'{primary} 즐기러 가는 {area}',f'{area}에서 {primary}, 취향대로 채운 {day}',f'{area} 가는 날, {primary}부터',f'{primary}{particle(primary,"으로","로")} 채우는 {area} {day}',f'{venue} 들러 {primary} 즐기기']
 if secondary:
  pair=primary+particle(primary,'과','와')+' '+secondary
  variants=[f'{area}, {pair} 즐기는 {day}',f'{pair}{particle(secondary,"으로","로")} 채운 {day}',f'{area}에서 만나는 {pair}',f'{primary}도 {secondary}도, {area} 나들이']+variants
 seed=int(hashlib.sha256(course['id'].encode()).hexdigest()[:8],16)%len(variants)
 variants=variants[seed:]+variants[:seed]
 variants += [f'{p["name"]}, {primary} 즐기는 {day}' for p in stops]
 # Names, unsupported popularity claims and numeric suffixes are never injected.
 return [v for v in dict.fromkeys(variants) if 8<=len(v)<=34],primary
