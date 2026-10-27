"""Server-owned save dates; never backfill a date for an existing unknown record."""
DATE_KEY='coursepick.reportSavedAt.v1'
TRACKED_KEYS={'course-favorites','coursepick.myCourses.v1','coursepick.editorialCopies.v1'}
def course_ids(key,value):
    if not isinstance(value,list):return set()
    return {item if isinstance(item,str) else item.get('id') for item in value if isinstance(item,str) or isinstance(item,dict)}-{None,''}
def next_dates(previous,current,dates,now):
    result={key:value for key,value in dates.items() if isinstance(key,str) and isinstance(value,str)} if isinstance(dates,dict) else {}
    for ident in current-previous:result[ident]=now
    return result
