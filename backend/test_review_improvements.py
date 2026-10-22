import json
import math
import random
import unittest
from copy import deepcopy
from types import SimpleNamespace
from unittest.mock import patch
from fastapi import HTTPException
from member_course_validation import normalize_course
from member_course_repository import public_snapshot, public_course_cache
from place_queries import recommendation_candidates
from read_cache import ReadCache
import member_accounts


def course(**changes):
    value = dict(id='custom-test', name='바다 산책', description='', region='부산',
                 stopIds=['a', 'b'], imagePlaceId='a', tags=['바다'], hours=2,
                 transport='도보', isPublic=True)
    value.update(changes)
    return value


class Request:
    def __init__(self, tables, calls):
        self.tables, self.calls, self.filters, self.orders = tables, calls, [], []
        self.bounds, self.size = (0, 100000), None
    def table(self, name): self.name = name; return self
    def select(self, fields): self.fields = fields; return self
    def eq(self, key, value): self.filters.append(lambda r: r.get(key) == value); return self
    def in_(self, key, values): self.filters.append(lambda r: r.get(key) in values); return self
    def contains(self, key, values):
        if key == 'value':
            self.filters.append(lambda r: isinstance(r.get(key), list) and any(isinstance(c, dict) and c.get('isPublic') is True for c in r[key]))
        else: self.filters.append(lambda r: all(v in (r.get(key) or []) for v in values))
        return self
    @property
    def not_(self): return self
    def like(self, key, pattern): self.filters.append(lambda r: not r[key].startswith('lodgingcsv_')); return self
    def order(self, key, desc=False, **kwargs): self.orders.append((key, desc)); return self
    def range(self, start, end): self.bounds = (start, end); return self
    def limit(self, value): self.size = value; return self
    def execute(self):
        rows = [r for r in self.tables.get(self.name, []) if all(f(r) for f in self.filters)]
        for key, desc in reversed(self.orders): rows.sort(key=lambda r: r[key], reverse=desc)
        start, end = self.bounds
        rows = rows[start:end+1]
        if self.size is not None: rows = rows[:self.size]
        self.calls.append((self.name, len(rows)))
        return SimpleNamespace(data=deepcopy(rows))


class Client:
    def __init__(self, tables):
        self.tables, self.calls = tables, []
        self.auth = SimpleNamespace(admin=SimpleNamespace(get_user_by_id=lambda uid: SimpleNamespace(user=SimpleNamespace(user_metadata={'nickname': '인증된 이름'}))))
    def table(self, name): return Request(self.tables, self.calls).table(name)


class ReviewTests(unittest.TestCase):
    def test_missing_tags_normalized_without_mutating_original(self):
        value = course(); del value['tags']
        self.assertEqual(normalize_course(value)['tags'], [])
        self.assertNotIn('tags', value)

    def test_malformed_fields_rejected(self):
        changes = [dict(tags={}), dict(tags=[{}]), dict(stopIds=['a','a']), dict(stopIds='a'),
                   dict(hours=True), dict(hours=math.nan), dict(transport=[]), dict(transport='비행기'),
                   dict(imagePlaceId='other'), dict(isPublic='true'), dict(accommodationId={}), dict(maxPeople=0)]
        for value in changes:
            with self.subTest(value=value), self.assertRaises(ValueError): normalize_course(course(**value))

    def test_schedule_validation_and_no_arbitrary_stay_cap(self):
        valid = [dict(placeId='a',label='관람',time='09:00',minutes=300),dict(placeId='b',label='휴식',time='15:00',minutes=60)]
        self.assertEqual(normalize_course(course(schedule=valid))['schedule'], valid)
        for schedule in [valid[:1], [valid[1],valid[0]], [valid[0],dict(valid[1],time='10:00')]]:
            with self.assertRaises(ValueError): normalize_course(course(schedule=schedule))

    def test_existing_member_courses_are_preserved(self):
        from pathlib import Path
        path = Path(__file__).resolve().parents[3] / 'outputs/review-improvements-20261020/before/member-courses.json'
        # The private audit fixture is deliberately kept outside application source.
        if not path.exists(): self.skipTest('Private snapshot is outside this checkout')
        data = json.loads(path.read_text(encoding='utf-8'))
        for row in data:
            for value in row['value']: normalize_course(value)

    def test_public_invalid_private_unknown_are_isolated(self):
        client = Client({'member_data':[{'user_id':'owner','data_key':'coursepick.myCourses.v1','value':[course(author='위조'),course(id='bad',tags={}),course(id='private',isPublic=False),course(id='unknown',stopIds=['a','z'])]}],
                         'places':[{'id':'a'},{'id':'b'}]})
        rows = public_snapshot(client)
        self.assertEqual(len(rows), 1)
        self.assertEqual(rows[0]['author'], '인증된 이름')
        self.assertEqual(rows[0]['authorId'], 'owner')

    def test_save_rejects_before_database_write(self):
        fake = SimpleNamespace(id='owner',user_metadata={'nickname':'인증된 이름'})
        for bad in [course(tags={}), course(stopIds=['a','a'])]:
            with patch.object(member_accounts,'member',return_value=fake), patch.object(member_accounts,'db') as db:
                with self.assertRaises(HTTPException) as error:
                    member_accounts.save(member_accounts.Value(key='coursepick.myCourses.v1',value=[bad]), 'Bearer fake')
                self.assertEqual(error.exception.status_code,422)
                db.assert_not_called()

    def test_save_checks_places_and_derives_author(self):
        fake = SimpleNamespace(id='owner',user_metadata={'nickname':'인증된 이름'})
        with patch.object(member_accounts,'member',return_value=fake), patch.object(member_accounts,'validate_course_title'), patch.object(member_accounts,'db') as db, patch.object(member_accounts,'known_places',return_value={'a','b'}):
            body = member_accounts.Value(key='coursepick.myCourses.v1',value=[course(author='다른 사용자',authorId='other')])
            member_accounts.save(body,'Bearer fake')
            payload = db.return_value.table.return_value.upsert.call_args.args[0]
            self.assertEqual(payload['value'][0]['authorId'],'owner')
            self.assertEqual(payload['value'][0]['author'],'인증된 이름')
        with patch.object(member_accounts,'member',return_value=fake), patch.object(member_accounts,'validate_course_title'), patch.object(member_accounts,'db') as db, patch.object(member_accounts,'known_places',return_value={'a'}):
            with self.assertRaises(HTTPException): member_accounts.save(member_accounts.Value(key='coursepick.myCourses.v1',value=[course()]),'Bearer fake')
            db.return_value.table.return_value.upsert.assert_not_called()

    def test_public_paging_and_cache_invalidation(self):
        public_course_cache.clear()
        with patch.object(member_accounts,'db'), patch.object(member_accounts,'public_snapshot',return_value=[course(id=str(i)) for i in range(105)]) as load:
            first = member_accounts.public_courses(0,100)
            second = member_accounts.public_courses(100,100)
            self.assertTrue(first['more']); self.assertFalse(second['more'])
            self.assertEqual(len(second['courses']),5);self.assertEqual(load.call_count,1)
            public_course_cache.clear();member_accounts.public_courses();self.assertEqual(load.call_count,2)
        for args in [(-1,100),(0,101),(0,0)]:
            with self.assertRaises(HTTPException):member_accounts.public_courses(*args)

    def test_unchanged_legacy_record_preserved_but_edits_rejected(self):
        fake = SimpleNamespace(id='owner',user_metadata={'nickname':'인증된 이름'})
        legacy = course(isPublic=False)
        with patch.object(member_accounts,'member',return_value=fake), patch.object(member_accounts,'validate_course_title'), patch.object(member_accounts,'db') as db, patch.object(member_accounts,'known_places',return_value={'a'}):
            db.return_value.table.return_value.select.return_value.eq.return_value.eq.return_value.limit.return_value.execute.return_value.data=[{'value':[legacy]}]
            member_accounts.save(member_accounts.Value(key='coursepick.myCourses.v1',value=[legacy]),'Bearer fake')
            for edited in [dict(legacy,isPublic=True),dict(legacy,name='변경한 제목')]:
                with self.assertRaises(HTTPException) as error:
                    member_accounts.save(member_accounts.Value(key='coursepick.myCourses.v1',value=[edited]),'Bearer fake')
                self.assertEqual(error.exception.status_code,422)

    def test_cache_expiry_copy_capacity_and_failures(self):
        cache = ReadCache(ttl=10,capacity=2)
        with patch('read_cache.monotonic',return_value=0):
            value = cache.read('a',lambda:[1]);value.append(2)
            self.assertEqual(cache.read('a',lambda:[]),[1])
            cache.read('b',lambda:2);cache.read('c',lambda:3);self.assertEqual(len(cache.entries),2)
        with patch('read_cache.monotonic',return_value=11): self.assertEqual(cache.read('b',lambda:4),4)
        def fail():raise ValueError()
        with self.assertRaises(ValueError): cache.read('error',fail)
        self.assertNotIn('error',cache.entries)

    def test_recommendation_candidates_preserve_full_ranking(self):
        rng = random.Random(14)
        rows = [dict(id=f'p{i:04}',region=rng.choice(['부산','서울']),category=rng.choice(['관광지','카페']),tags=rng.choice([[],['바다']]),rating=rng.randint(0,50)/10) for i in range(2000)]
        for region,category,tag in [('','',''),('부산','',''),('부산','카페','바다'),('없는 지역','카페','바다')]:
            client=Client({'places':rows})
            rank=lambda p:(-(p['rating']+3*bool(region and p['region']==region)+3*bool(category and p['category']==category)+2*bool(tag and tag in p['tags'])),-p['rating'],p['id'])
            candidates=recommendation_candidates(client,region,category,tag)
            self.assertEqual(sorted(candidates,key=rank)[:6],sorted(rows,key=rank)[:6])
            self.assertLessEqual(sum(count for _,count in client.calls),48)


if __name__ == '__main__': unittest.main()
