import unittest
from datetime import date,timedelta
from travel_journal_validation import validate_journals,validate_travel_taste
class TravelJournalValidationTests(unittest.TestCase):
 def record(self):return {'courseId':'course-1','title':'서울 산책','body':'기분 좋은 산책이었다.','visitedAt':date.today().isoformat(),'placeIds':['place-1','place-2']}
 def test_preserves_private_record(self):
  j=self.record();self.assertEqual(validate_journals([j]),[j])
 def test_rejects_future_invalid_or_duplicate_records(self):
  j=self.record()
  for records in ([j,j],[{**j,'visitedAt':'2026-02-30'}],[{**j,'visitedAt':(date.today()+timedelta(days=1)).isoformat()}],[{**j,'placeIds':[]}],[{**j,'placeIds':['p','p']}],[{**j,'body':''}]):
   with self.subTest(records=records),self.assertRaises(ValueError):validate_journals(records)
 def test_four_axes_independent(self):
  v=dict(planning=100,experience=0,exploration=60,spending=30);self.assertEqual(validate_travel_taste(v),v)
 def test_rejects_legacy_and_noninteger_axes(self):
  for v in ({'activity':20},{'planning':True,'experience':0,'exploration':50,'spending':50},{'planning':101,'experience':0,'exploration':50,'spending':50}):
   with self.assertRaises(ValueError):validate_travel_taste(v)
 def test_save_route_uses_existing_member_data(self):
  from unittest.mock import patch,MagicMock
  from types import SimpleNamespace
  from member_accounts import save,Value
  fake=MagicMock();j=self.record()
  with patch('member_accounts.member',return_value=SimpleNamespace(id='member-1')),patch('member_accounts.db',return_value=fake):
   save(Value(key='coursepick.travelJournals.v1',value=[j]),'Bearer mock')
   payload=fake.table.return_value.upsert.call_args.args[0]
   self.assertEqual(payload['user_id'],'member-1');self.assertEqual(payload['value'],[j]);self.assertEqual(payload['data_key'],'coursepick.travelJournals.v1')
if __name__=='__main__':unittest.main()
