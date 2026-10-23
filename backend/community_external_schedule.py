"""Normalize mixed native/Kakao demo schedules without provider-body storage."""
from kakao_refs import validate_kakao_refs

def validate_external_schedule(course):
    native=course.get('place_ids')
    schedule=course.get('schedule')
    if not isinstance(native,list) or not isinstance(schedule,list) or not 2<=len(schedule)<=7:
        raise ValueError('Invalid mixed itinerary')
    native_order=[];refs=[]
    for item in schedule:
        if not isinstance(item,dict):raise ValueError('Invalid schedule item')
        ref=item.get('kakao_ref')
        if ref is not None:
            if item.get('place_id') is not None:raise ValueError('Conflicting schedule sources')
            clean=validate_kakao_refs([ref])[0]
            if clean['day']!=item.get('day',1):raise ValueError('Conflicting visit day')
            refs.append(clean)
        else:
            pid=item.get('place_id')
            if not isinstance(pid,str):raise ValueError('Missing native place')
            native_order.append(pid)
    if native_order!=native:raise ValueError('Invalid native itinerary order')
    validate_kakao_refs(refs)
    cover=course.get('cover_place_id')
    if cover is not None and cover not in native:raise ValueError('Invalid cover')
    if not refs and cover is None:raise ValueError('Missing native cover')
    return refs
