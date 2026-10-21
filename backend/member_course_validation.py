"""Validate member courses without rewriting stored legacy records."""
from course_traits import validate_trait_facts,course_trait_basis
import math
import re
from copy import deepcopy

TRANSPORTS = {'도보', '자동차', '대중교통'}
PUBLIC_FIELDS = {'id', 'name', 'description', 'region', 'stopIds', 'imagePlaceId',
                 'tags', 'representativeTags', 'schedule', 'hours', 'transport',
                 'traitFacts', 'maxPeople', 'durationDays', 'stopDays', 'accommodationId', 'createdAt'}


def text(value, limit=200):
    return isinstance(value, str) and bool(value.strip()) and len(value) <= limit


def number(value, minimum=0):
    return type(value) in (int, float) and math.isfinite(value) and value > minimum


def normalize_course(value):
    if not isinstance(value, dict):
        raise ValueError('코스 형식')
    course = deepcopy(value)
    for key, limit in [('id', 200), ('name', 200), ('region', 100)]:
        if not text(course.get(key), limit):
            raise ValueError(key)
    ids = course.get('stopIds')
    if not isinstance(ids, list) or not 2 <= len(ids) <= 100 or not all(text(v) for v in ids) or len(set(ids)) != len(ids):
        raise ValueError('장소 ID')
    if not number(course.get('hours')) or not isinstance(course.get('transport'), str) or course['transport'] not in TRANSPORTS:
        raise ValueError('시간 또는 이동수단')
    if not isinstance(course.get('description', ''), str) or len(course.get('description', '')) > 20000:
        raise ValueError('설명')
    course.setdefault('description', '')
    for key in ['tags', 'representativeTags']:
        tags = course.get(key, [])
        if not isinstance(tags, list) or len(tags) > 500 or not all(text(v, 100) for v in tags):
            raise ValueError('태그')
        course[key] = list(dict.fromkeys(tags))
    if course.get('imagePlaceId') not in ids:
        raise ValueError('대표 장소')
    if course.get('accommodationId') is not None and not text(course['accommodationId']):
        raise ValueError('숙소')
    if 'isPublic' in course and type(course['isPublic']) is not bool:
        raise ValueError('공개 여부')
    if 'createdAt' in course and not text(course['createdAt'], 100):
        raise ValueError('생성일')
    for key in ['durationDays', 'maxPeople']:
        if course.get(key) is not None and (type(course[key]) is not int or course[key] < 1):
            raise ValueError(key)
    if 'stopDays' in course:
        days=course['stopDays']
        maximum=course.get('durationDays') or 1
        if not isinstance(days,dict) or any(pid not in ids or type(day) is not int or not 1<=day<=min(31,maximum) for pid,day in days.items()):
            raise ValueError('코스 일차')
    schedule = course.get('schedule')
    if schedule is not None:
        if not isinstance(schedule, list) or len(schedule) != len(ids):
            raise ValueError('일정 개수')
        previous = -1
        for pid, item in zip(ids, schedule):
            if not isinstance(item, dict) or item.get('placeId') != pid or not text(item.get('label')):
                raise ValueError('일정 장소')
            time = item.get('time')
            day = item.get('day', 1)
            if not isinstance(time, str) or not re.fullmatch(r'([01]\d|2[0-3]):[0-5]\d', time) or type(day) is not int or day < 1:
                raise ValueError('일정 시간')
            start = (day - 1) * 1440 + int(time[:2]) * 60 + int(time[3:])
            if not number(item.get('minutes')) or start < previous:
                raise ValueError('일정 순서 또는 체류시간')
            previous = start + item['minutes']
    if 'traitFacts' in course:
        course['traitFacts'] = validate_trait_facts(course['traitFacts']) or {}
        if course['traitFacts'].get('reservationRequiredCount',0)>len(ids) and (not course['traitFacts'].get('basis') or course['traitFacts']['basis']==course_trait_basis(course)):raise ValueError('예약 장소 수')
    return course


def place_ids(courses):
    return sorted({pid for c in courses for pid in [*c['stopIds'], c.get('accommodationId')] if pid})


def known_places(client, ids):
    found = set()
    for start in range(0, len(ids), 200):
        rows = client.table('places').select('id').in_('id', ids[start:start + 200]).execute().data
        found.update(row['id'] for row in rows)
    return found
