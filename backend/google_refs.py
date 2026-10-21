import re

def validate_google_refs(value):
    if value is None:return []
    if not isinstance(value,list) or len(value)>20:raise ValueError('Google 장소 개수')
    result=[];seen=set()
    for ref in value:
        if not isinstance(ref,dict) or set(ref)!={'placeId','day'}:raise ValueError('Google 장소 필드')
        pid,day=ref['placeId'],ref['day']
        if not isinstance(pid,str) or not re.fullmatch(r'[A-Za-z0-9_-]{1,255}',pid) or pid in seen:raise ValueError('Google 장소 ID')
        if type(day) is not int or not 1<=day<=31:raise ValueError('Google 방문 일차')
        seen.add(pid);result.append({'placeId':pid,'day':day})
    return result
