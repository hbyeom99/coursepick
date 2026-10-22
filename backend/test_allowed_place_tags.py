import unittest,json
from pathlib import Path
from allowed_place_tags import classify_allowed_tags,ALLOWED
class TagTests(unittest.TestCase):
 def tags(self,p):return [i['tag'] for i in classify_allowed_tags(p)]
 def test_category(self):self.assertIn('카페',self.tags({'category':'카페'}))
 def test_no_name_inference(self):self.assertEqual(self.tags({'name':'오로라 힐링 무료주차 카페','categoryPath':'서비스,산업 > 보관,저장'}),[])
 def test_approved_parent(self):self.assertIn('맥주',self.tags({'tags':['수제맥주']}))
 def test_alias(self):self.assertIn('예쁜 카페',self.tags({'tags':['예카']}))
 def test_condition_not_guessed(self):self.assertEqual(self.tags({'categoryPath':'무료주차 > 예약없이'}),[])
 def test_all_allowed(self):self.assertTrue(all(i['tag'].replace(' ','').lower() in ALLOWED for i in classify_allowed_tags({'tags':['수제맥주','한옥 카페','예카']})))
 def test_mirror(self):
  root=Path(__file__).resolve().parents[1]
  for front,back in [('homeSearchKeywords.json','home_search_keywords.json'),('approvedSearchRelations.json','approved_search_relations.json')]:self.assertEqual(json.loads((root/'src/data'/front).read_text(encoding='utf-8')),json.loads((root/'backend'/back).read_text(encoding='utf-8')))
if __name__=='__main__':unittest.main()
