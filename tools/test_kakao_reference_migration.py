import sys, unittest
from types import SimpleNamespace
from unittest.mock import patch
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
from kakao_reference_migration import migrate_community_course, migrate_zip_payload
from zip_schedule_details import validate_zip_stop_details

REF={'placeId':'123','day':1,'query':'사용자 장소명','category':'전체','page':1}
class MigrationTests(unittest.TestCase):
    def test_course_order_day_and_time_preserved(self):
        before={'place_ids':['a','b'],'cover_place_id':'a','schedule':[{'place_id':'a','day':2,'time':'09:15','duration_minutes':45,'label':'약속'},{'place_id':'b','time':'11:00','duration_minutes':60}]}
        patch, changes=migrate_community_course(before,{'a':REF})
        self.assertEqual(changes,['a']);self.assertEqual(patch['place_ids'],['b'])
        self.assertEqual(patch['schedule'][0],{'kakao_ref':{**REF,'day':2},'day':2,'time':'09:15','duration_minutes':45,'label':'약속'})
        self.assertEqual(before['schedule'][0]['place_id'],'a')
    def test_zip_mixed_order_notes_and_unset_duration_preserved(self):
        before={'title':'유지','expenses':[{'amount':5}],'days':[{'date':'2026-10-24','stopIds':['a','b'],'kakaoPlaceRefs':[], 'itineraryOrder':['n:b','n:a'],'timings':{'a':{'time':'13:00','minutes':0},'b':{'time':'14:00','minutes':30}},'stopDetails':{'n:a':{'note':'예약 메모'}}}]}
        after, changes=migrate_zip_payload(before,{'a':REF});day=after['days'][0]
        self.assertEqual(day['itineraryOrder'],['n:b','k:123'])
        self.assertEqual(day['stopDetails']['k:123'],{'time':'13:00','minutes':0,'note':'예약 메모'})
        self.assertEqual(day['timings'],{'b':{'time':'14:00','minutes':30}})
        self.assertEqual(after['expenses'],before['expenses']);self.assertEqual(before['days'][0]['stopIds'],['a','b'])
    def test_duplicate_is_blocked(self):
        with self.assertRaises(ValueError):migrate_zip_payload({'days':[{'stopIds':['a'],'kakaoPlaceRefs':[REF]}]},{'a':REF})
    def test_zip_validation_rejects_invalid_notes_and_keeps_zero(self):
        self.assertEqual(validate_zip_stop_details({'k:123':{'minutes':0}}, {'k:123'}),{'k:123':{'minutes':0}})
        with self.assertRaises(ValueError):validate_zip_stop_details({'k:123':{'minutes':-1}}, {'k:123'})
        with self.assertRaises(ValueError):validate_zip_stop_details({'k:123':{'note':'x'*1001}}, {'k:123'})
    def test_zip_save_preserves_external_details_when_older_client_omits_them(self):
        import zip_rooms
        stored={'id':'room','revision':4,'payload':{'expenses':[{'amount':10}],'days':[{'date':'2026-10-24','stopIds':['b'],'kakaoPlaceRefs':[REF],'stopDetails':{'k:123':{'time':'13:00','minutes':0,'note':'유지'}}}]}}
        class FakeDB:
            def table(self,*a):return self
            def update(self,value):self.value=value;return self
            def eq(self,*a):return self
            def execute(self):return SimpleNamespace(data=[{'id':'room',**self.value}])
        db=FakeDB()
        body=zip_rooms.ScheduleInput(revision=4,title='유지',transport='도보',days=[{'date':'2026-10-24','stopIds':['b'],'kakaoPlaceRefs':[REF],'itineraryOrder':['k:123','n:b'],'timings':{'b':{'time':'14:00','minutes':30}}}])
        with patch.object(zip_rooms,'member',return_value=SimpleNamespace(id='member')),patch.object(zip_rooms,'db',return_value=db),patch.object(zip_rooms,'room_for',return_value=stored),patch.object(zip_rooms,'serialize',side_effect=lambda client,row,user:row),patch('member_course_validation.known_places',return_value={'b'}):
            result=zip_rooms.edit_schedule('room',body,'Bearer mock')
        self.assertEqual(result['payload']['days'][0]['stopDetails'],stored['payload']['days'][0]['stopDetails'])
        self.assertEqual(result['payload']['expenses'],stored['payload']['expenses'])
        self.assertEqual(result['revision'],5)
if __name__=='__main__':unittest.main()
