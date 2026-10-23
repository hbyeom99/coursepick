"""Pure, loss-checked migration of native itinerary identities to verified Kakao refs."""
from copy import deepcopy
from kakao_refs import validate_kakao_refs
from community_external_schedule import validate_external_schedule
from zip_schedule_details import validate_zip_stop_details

def migrate_community_course(before, mapping):
    after = deepcopy(before)
    changes = []
    for visit in after['schedule']:
        pid = visit.get('place_id')
        if pid not in mapping:
            continue
        ref = {**mapping[pid], 'day': visit.get('day', 1)}
        validate_kakao_refs([ref])
        visit.pop('place_id')
        visit['kakao_ref'] = ref
        changes.append(pid)
    if not changes:
        return None, []
    after['place_ids'] = [v['place_id'] for v in after['schedule'] if v.get('place_id')]
    if after.get('cover_place_id') not in after['place_ids']:
        after['cover_place_id'] = next(iter(after['place_ids']), None)
    validate_external_schedule(after)
    return {key: after[key] for key in ('schedule', 'place_ids', 'cover_place_id')}, changes

def migrate_zip_payload(before, mapping):
    after = deepcopy(before)
    changes = []
    for day in after.get('days', []):
        old_ids = list(day.get('stopIds') or [])
        refs = list(day.get('kakaoPlaceRefs') or [])
        allowed_before = ['n:' + pid for pid in old_ids] + ['k:' + ref['placeId'] for ref in refs]
        order = list(dict.fromkeys([*(day.get('itineraryOrder') or []), *allowed_before]))
        order = [key for key in order if key in allowed_before]
        details = deepcopy(day.get('stopDetails') or {})
        timings = deepcopy(day.get('timings') or {})
        translated = {}
        for pid in old_ids:
            if pid not in mapping:
                continue
            ref = {**mapping[pid], 'day': 1}
            if any(r['placeId'] == ref['placeId'] for r in refs):
                raise ValueError('Duplicate Kakao identity would merge visits')
            refs.append(ref)
            key = 'k:' + ref['placeId']
            translated['n:' + pid] = key
            detail = {**timings.pop(pid, {}), **details.pop('n:' + pid, {})}
            # Older Zip durations can be floats. Retain exact integral values.
            if type(detail.get('minutes')) is float and detail['minutes'].is_integer():
                detail['minutes'] = int(detail['minutes'])
            if detail:
                if key in details:
                    raise ValueError('Conflicting visit notes')
                details[key] = detail
            changes.append(pid)
        if not translated:
            continue
        day['stopIds'] = [pid for pid in old_ids if pid not in mapping]
        day['kakaoPlaceRefs'] = validate_kakao_refs(refs)
        day['itineraryOrder'] = [translated.get(key, key) for key in order]
        day['timings'] = timings
        allowed = {'n:' + pid for pid in day['stopIds']} | {'k:' + r['placeId'] for r in refs}
        checked = validate_zip_stop_details(details, allowed)
        if checked != details:
            raise ValueError('Unexpected lost visit details')
        day['stopDetails'] = checked
        if len(day['itineraryOrder']) != len(allowed_before):
            raise ValueError('Visit count changed')
    return (after if changes else None), changes
