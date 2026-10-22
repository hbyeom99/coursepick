import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock,patch
from fastapi import HTTPException
import zip_rooms as z

USER='11111111-1111-4111-8111-111111111111'
OTHER='22222222-2222-4222-8222-222222222222'
ROOM='33333333-3333-4333-8333-333333333333'
class ZipTests(unittest.TestCase):
 def test_foreign_room_denied(self):
  with patch.object(z,'execute',side_effect=[[{'id':ROOM,'owner_id':OTHER}],[]]):
   with self.assertRaises(HTTPException) as caught:z.room_for(MagicMock(),ROOM,SimpleNamespace(id=USER))
  self.assertEqual(caught.exception.status_code,403)
 def test_owner_allowed(self):
  with patch.object(z,'execute',return_value=[{'id':ROOM,'owner_id':USER}]):self.assertEqual(z.room_for(MagicMock(),ROOM,SimpleNamespace(id=USER))['id'],ROOM)
 def test_bad_uuid(self):
  with self.assertRaises(HTTPException):z.uid('not-a-room')
 def test_member_taste_must_have_four_axes(self):
  with patch.object(z,'member',return_value=SimpleNamespace(id=USER)),patch.object(z,'db'),patch.object(z,'room_for',return_value={'id':ROOM}):
   with self.assertRaises(HTTPException) as caught:z.edit_member(ROOM,z.MemberInput(taste={'planning':50}),None)
  self.assertEqual(caught.exception.status_code,422)
 def test_taste_boolean_rejected(self):
  with patch.object(z,'member',return_value=SimpleNamespace(id=USER)),patch.object(z,'db'),patch.object(z,'room_for',return_value={'id':ROOM}):
   with self.assertRaises(HTTPException):z.edit_member(ROOM,z.MemberInput(taste=dict.fromkeys(z.AXES,True)),None)
 def test_schedule_conflict(self):
  with patch.object(z,'member',return_value=SimpleNamespace(id=USER)),patch.object(z,'db'),patch.object(z,'room_for',return_value={'id':ROOM,'owner_id':OTHER}),patch.object(z,'execute',return_value=[]):
   with self.assertRaises(HTTPException) as caught:z.edit_schedule(ROOM,z.ScheduleInput(revision=1,days=[{'date':'2026-10-20','stopIds':[]}]),None)
  self.assertEqual(caught.exception.status_code,409)
 def test_non_owner_member_can_edit_schedule(self):
  with patch.object(z,'member',return_value=SimpleNamespace(id=USER)),patch.object(z,'db'),patch.object(z,'room_for',return_value={'id':ROOM,'owner_id':OTHER}),patch.object(z,'execute',return_value=[{'id':ROOM}]),patch.object(z,'serialize',return_value={'revision':2}):
   self.assertEqual(z.edit_schedule(ROOM,z.ScheduleInput(revision=1,days=[{'date':'2026-10-20','stopIds':[]}]),None)['revision'],2)
 def test_invite_for_another_recipient_denied(self):
  with patch.object(z,'member',return_value=SimpleNamespace(id=USER)),patch.object(z,'db'),patch.object(z,'execute',return_value=[{'recipient_id':OTHER}]):
   with self.assertRaises(HTTPException) as caught:z.join(z.JoinInput(token='secret'),None)
  self.assertEqual(caught.exception.status_code,404)
 def test_date_span_rejected(self):
  with patch.object(z,'member',return_value=SimpleNamespace(id=USER)),patch.object(z,'db'),patch.object(z,'room_for',return_value={'id':ROOM}):
   with self.assertRaises(HTTPException):z.edit_schedule(ROOM,z.ScheduleInput(revision=1,days=[{'date':'2026-10-20','stopIds':[]},{'date':'2027-01-01','stopIds':[]}]),None)
if __name__=='__main__':unittest.main()
