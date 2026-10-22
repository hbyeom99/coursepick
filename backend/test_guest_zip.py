import unittest
from unittest.mock import MagicMock,patch
from types import SimpleNamespace
import zip_rooms as z
from fastapi import HTTPException
class InvitePreviewTests(unittest.TestCase):
 def test_guest_preview_is_limited_and_does_not_join(self):
  client=MagicMock()
  with patch.object(z,'db',return_value=client),patch.object(z,'invited_room',return_value={'room_id':'room'}),patch.object(z,'execute',return_value=[{'id':'room'}]),patch.object(z,'serialize',return_value={'id':'room','name':'test','description':'trip','region':'부산','image':'','members':[{'id':'private-user','name':'member','taste':{'planning':80},'keywords':['tag']}]}) as serial:
   result=z.preview_invite(z.JoinInput(token='valid'),None)
  self.assertEqual(result['memberCount'],1)
  self.assertEqual(result['members'],[{'name':'member'}])
  self.assertNotIn('taste',str(result))
  client.table.assert_called_once_with('zip_rooms')
 def test_wrong_invite_rejected(self):
  with patch.object(z,'execute',return_value=[]):
   with self.assertRaises(HTTPException) as e:z.invited_room(MagicMock(),z.JoinInput(token='bad'),None)
  self.assertEqual(e.exception.status_code,404)
 def test_guest_cannot_lookup_recipient_invite_by_id(self):
  with self.assertRaises(HTTPException):z.invited_room(MagicMock(),z.JoinInput(inviteId='known-id'),None)
 def test_recipient_checked_when_joining(self):
  with patch.object(z,'execute',return_value=[{'recipient_id':'other'}]):
   with self.assertRaises(HTTPException):z.invited_room(MagicMock(),z.JoinInput(token='valid'),SimpleNamespace(id='member'))
if __name__=='__main__':unittest.main()

from member_course_validation import normalize_course
class CourseDayValidationTests(unittest.TestCase):
 def course(self):return {'id':'test','name':'trip','region':'부산','stopIds':['a','b'],'imagePlaceId':'a','hours':2,'transport':'도보','durationDays':2,'stopDays':{'a':1,'b':2}}
 def test_days_preserved(self):self.assertEqual(normalize_course(self.course())['stopDays']['b'],2)
 def test_invalid_day_rejected(self):
  for days in ({'a':True},{'a':3},{'foreign':1}):
   with self.subTest(days=days),self.assertRaises(ValueError):normalize_course({**self.course(),'stopDays':days})
 def test_null_duration_not_server_error(self):
  with self.assertRaises(ValueError):normalize_course({**self.course(),'durationDays':None})
