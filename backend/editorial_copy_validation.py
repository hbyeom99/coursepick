"""Private editable editorial snapshots; never create or overwrite place rows."""
from copy import deepcopy
from urllib.parse import urlparse
import re

def validate_editorial_copies(value):
    if not isinstance(value,list) or len(value)>100:raise ValueError()
    result=[];seen=set()
    for item in value:
        if not isinstance(item,dict):raise ValueError()
        for key,limit in [('id',200),('originalCourseId',200),('name',200),('region',100)]:
            if not isinstance(item.get(key),str) or not item[key].strip() or len(item[key])>limit:raise ValueError()
        if not item['id'].startswith('editorial-copy-') or item['id'] in seen:raise ValueError()
        seen.add(item['id'])
        if item.get('isPublic') is not False or item.get('transport') not in ('도보','자동차','대중교통'):raise ValueError()
        days=item.get('durationDays')
        if type(days) is not int or not 1<=days<=31:raise ValueError()
        if not isinstance(item.get('description',''),str) or len(item.get('description',''))>20000:raise ValueError()
        visits=item.get('editorialVisits')
        if not isinstance(visits,list) or not 2<=len(visits)<=100:raise ValueError()
        visits_seen=set();clean=[]
        for visit in visits:
            if not isinstance(visit,dict):raise ValueError()
            for key in ('visit_id','name'):
                if not isinstance(visit.get(key),str) or not visit[key].strip() or len(visit[key])>300:raise ValueError()
            if visit['visit_id'] in visits_seen:raise ValueError()
            visits_seen.add(visit['visit_id'])
            if type(visit.get('day')) is not int or not 1<=visit['day']<=days:raise ValueError()
            if visit.get('time') and (not isinstance(visit['time'],str) or not re.fullmatch(r'([01]\d|2[0-3]):[0-5]\d',visit['time'])):raise ValueError()
            row={}
            for key in ('visit_id','place_id','name','time','activity','location','region','category','match_status','image_url'):
                field=visit.get(key)
                if field is not None:
                    if not isinstance(field,str) or len(field)>2000:raise ValueError()
                    row[key]=field
            image=row.get('image_url','')
            if image and not (image.startswith('/images/') or urlparse(image).scheme in ('https','http')):raise ValueError()
            row['day']=visit['day'];row['cover_image']=bool(visit.get('cover_image'));clean.append(row)
        tags=item.get('tags',[])
        if not isinstance(tags,list) or len(tags)>50 or any(not isinstance(t,str) or len(t)>100 for t in tags):raise ValueError()
        representative=item.get('representativeTags',tags[:3])
        if not isinstance(representative,list) or len(representative)>3 or any(t not in tags for t in representative):raise ValueError()
        notices=item.get('editorialNotices',[])
        if not isinstance(notices,list) or len(notices)>100 or any(not isinstance(t,str) or len(t)>2000 for t in notices):raise ValueError()
        copy={key:deepcopy(item[key]) for key in ('id','originalCourseId','name','region','transport','durationDays')}
        copy.update(description=item.get('description',''),tags=tags,representativeTags=representative,editorialVisits=clean,editorialNotices=notices,stopIds=list(dict.fromkeys(v['place_id'] for v in clean if v.get('place_id'))),imagePlaceId=None,isPublic=False,source='editorial-copy',author='나')
        result.append(copy)
    return result
