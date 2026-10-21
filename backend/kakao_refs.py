import re

def validate_kakao_refs(value):
    if value is None:return []
    if not isinstance(value,list) or len(value)>20:raise ValueError('Kakao 장소 개수')
    result=[];seen=set()
    for ref in value:
        if not isinstance(ref,dict) or set(ref)!={'placeId','day','query','category','page'}:raise ValueError('Kakao 장소 필드')
        pid,day,query,category,page=(ref[k] for k in ('placeId','day','query','category','page'))
        if not isinstance(pid,str) or not re.fullmatch(r'[0-9]{1,40}',pid) or pid in seen:raise ValueError('Kakao 장소 ID')
        if type(day) is not int or not 1<=day<=31:raise ValueError('Kakao 방문 일차')
        if not isinstance(query,str) or not query.strip() or len(query)>80:raise ValueError('Kakao 검색 조건')
        if not isinstance(category,str) or category not in ('전체','맛집','카페','관광','체험','숙소') or type(page) is not int or not 1<=page<=45:raise ValueError('Kakao 검색 조건')
        seen.add(pid);result.append(dict(placeId=pid,day=day,query=query.strip(),category=category,page=page))
    return result
