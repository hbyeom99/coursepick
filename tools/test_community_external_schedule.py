import sys,unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'backend'))
from community_external_schedule import validate_external_schedule

class ScheduleTests(unittest.TestCase):
    def test_legacy(self):
        self.assertEqual(validate_external_schedule({'place_ids':['a','b'],'cover_place_id':'a','schedule':[{'place_id':'a'},{'place_id':'b'}]}),[])
    def test_mixed_and_all_external(self):
        ref={'placeId':'123','query':'원본 장소 검색어','category':'전체','page':1,'day':1}
        self.assertEqual(len(validate_external_schedule({'place_ids':['a'],'cover_place_id':None,'schedule':[{'place_id':'a'},{'kakao_ref':ref}]})),1)
        ref2={**ref,'placeId':'456'}
        self.assertEqual(len(validate_external_schedule({'place_ids':[],'cover_place_id':None,'schedule':[{'kakao_ref':ref},{'kakao_ref':ref2}]})),2)
    def test_conflicting_or_duplicate_refs(self):
        ref={'placeId':'123','query':'검색어','category':'전체','page':1,'day':1}
        for schedule in [[{'place_id':'a','kakao_ref':ref},{'place_id':'b'}],[{'kakao_ref':ref},{'kakao_ref':ref}],[{'kakao_ref':{**ref,'address':'forbidden'}},{'place_id':'b'}]]:
            with self.assertRaises(ValueError):validate_external_schedule({'place_ids':['b'],'cover_place_id':'b','schedule':schedule})

if __name__=='__main__':unittest.main()
