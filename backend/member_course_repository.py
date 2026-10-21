from member_course_validation import normalize_course, known_places, place_ids, PUBLIC_FIELDS
from read_cache import ReadCache

public_course_cache = ReadCache(ttl=30, capacity=1)


def public_snapshot(client):
    result, candidates, offset = [], [], 0
    while True:
        rows = (client.table('member_data').select('user_id,value')
                .eq('data_key', 'coursepick.myCourses.v1')
                
                .contains('value', '[{"isPublic":true}]').order('user_id')
                .range(offset, offset + 199).execute().data)
        for row in rows:
            if not isinstance(row.get('value'), list):
                continue
            for value in row['value']:
                if not isinstance(value, dict) or value.get('isPublic') is not True:
                    continue
                try:
                    course = normalize_course(value)
                except ValueError:
                    continue
                candidates.append((str(row['user_id']), course))
        if len(rows) < 200:
            break
        offset += len(rows)
    existing = known_places(client, place_ids([c for _, c in candidates]))
    authors = {}
    for owner, course in candidates:
        if not set(place_ids([course])).issubset(existing):
            continue
        if owner not in authors:
            # Derive identity from the row owner and authenticated account, never the submitted author.
            user = client.auth.admin.get_user_by_id(owner).user
            name = (user.user_metadata or {}).get('nickname') if user else None
            authors[owner] = name.strip()[:20] if isinstance(name, str) and name.strip() else '여행자'
        item = {key: course[key] for key in PUBLIC_FIELDS if key in course}
        item.update(author=authors[owner], authorId=owner, isPublic=True,
                    source='member-public', isDemo=False, theme='사용자 코스')
        result.append(item)
    return sorted(result, key=lambda c: (c['authorId'], c['id']))
