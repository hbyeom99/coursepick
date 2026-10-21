from datetime import date
AXES=('planning','experience','exploration','spending')
def validate_travel_taste(value):
    if value is None:return None
    if not isinstance(value,dict) or set(value)!=set(AXES):raise ValueError()
    if any(type(value[a]) is not int or not 0<=value[a]<=100 for a in AXES):raise ValueError()
    return {a:value[a] for a in AXES}
def validate_journals(value):
    if not isinstance(value,list) or len(value)>500:raise ValueError()
    seen=set();result=[]
    for j in value:
        if not isinstance(j,dict):raise ValueError()
        cid=j.get('courseId');title=j.get('title');body=j.get('body');day=j.get('visitedAt');places=j.get('placeIds')
        if not isinstance(cid,str) or not 1<=len(cid)<=200 or cid in seen:raise ValueError()
        if not isinstance(title,str) or not 1<=len(title.strip())<=80:raise ValueError()
        if not isinstance(body,str) or not 1<=len(body.strip())<=5000:raise ValueError()
        if not isinstance(day,str) or len(day)!=10:raise ValueError()
        try:visited=date.fromisoformat(day)
        except (ValueError,TypeError):raise ValueError() from None
        if visited>date.today():raise ValueError()
        if not isinstance(places,list) or not 1<=len(places)<=100 or any(not isinstance(p,str) or not 1<=len(p)<=200 for p in places) or len(set(places))!=len(places):raise ValueError()
        seen.add(cid);result.append({'courseId':cid,'title':title.strip(),'body':body.strip(),'visitedAt':day,'placeIds':places})
    return result
