import unittest
from copy import deepcopy
from zip_voting import *
def course(id,days=1):return {'id':id,'name':'검증 코스 '+id,'region':'서울','transport':'도보','stopIds':[id+'p1',id+'p2'],'tags':['산책'],'durationDays':days,'stopDays':{id+'p1':1,id+'p2':days},'schedule':[{'placeId':id+'p1','time':'10:00','minutes':60,'day':1},{'placeId':id+'p2','time':'13:00','minutes':90,'day':days}]}
class VotingTests(unittest.TestCase):
 def poll(self):return start_poll([course('a'),course('b'),course('c')],['u1','u2'],'u1')
 def vote(self,p,u,c):return cast_vote(p,u,c,p['id'],p['round'])
 def test_partial_vote_not_final(self):
  p=self.vote(self.poll(),'u1','a');self.assertEqual(p['status'],'active');self.assertNotIn('winnerId',p)
 def test_one_vote_per_member(self):
  p=self.vote(self.poll(),'u1','a')
  with self.assertRaises(VoteError):self.vote(p,'u1','b')
 def test_late_member_not_eligible(self):
  with self.assertRaises(VoteError) as e:self.vote(self.poll(),'u3','a')
  self.assertEqual(e.exception.status,403)
 def test_unanimous_winner(self):
  p=self.vote(self.vote(self.poll(),'u1','a'),'u2','a');self.assertEqual(p['status'],'completed');self.assertEqual(p['winnerId'],'a')
 def test_tie_revote_only_leaders_and_reset(self):
  p=self.vote(self.vote(self.poll(),'u1','a'),'u2','b');self.assertEqual(p['status'],'tie');q=revote(p,p['id'],1);self.assertEqual([c['id'] for c in q['candidates']],['a','b']);self.assertEqual(q['round'],2);self.assertEqual(q['votes'],{});self.assertEqual(q['eligible'],p['eligible']);self.assertEqual(len(q['history']),1)
 def test_stale_round_rejected(self):
  p=self.vote(self.vote(self.poll(),'u1','a'),'u2','b');q=revote(p,p['id'],1)
  with self.assertRaises(VoteError):cast_vote(q,'u1','a',q['id'],1)
 def test_no_apply_while_voting_or_tied(self):
  for p in (self.poll(),self.vote(self.vote(self.poll(),'u1','a'),'u2','b')):
   with self.assertRaises(VoteError):winning_schedule(p,[],'2026-10-20')
 def test_schedule_preserves_course_days_times_and_room_start(self):
  p=start_poll([course('a',2),course('b')],['u1'],'u1');p=self.vote(p,'u1','a');title,days=winning_schedule(p,[{'date':'2026-10-20','stopIds':['old']}],'2026-10-20');self.assertEqual(days[0]['stopIds'],['ap1']);self.assertEqual(days[1]['stopIds'],['ap2']);self.assertEqual(days[1]['date'],'2026-10-21');self.assertEqual(days[1]['timings']['ap2']['minutes'],90)
 def test_repeat_apply_rejected(self):
  p=self.vote(self.vote(self.poll(),'u1','a'),'u2','a');p['appliedAt']='now'
  with self.assertRaises(VoteError):winning_schedule(p,[],'2026-10-20')
 def test_public_response_keeps_other_votes_private(self):
  p=self.vote(self.poll(),'u1','a');public=public_poll(p,'u2');self.assertNotIn('votes',public);self.assertNotIn('eligible',public);self.assertEqual(public['votedCount'],1);self.assertIsNone(public['myVote']);self.assertTrue(public['canVote'])
 def test_candidate_validation(self):
  for c in ({**course('a'),'stopIds':['p','p']},{**course('a'),'durationDays':32},{**course('a'),'schedule':[{'time':'25:00'}]}):
   with self.assertRaises(VoteError):candidate(c)
 def test_schedule_edits_keep_poll_payload(self):
  from unittest.mock import patch,MagicMock
  from types import SimpleNamespace
  import zip_rooms as z
  client=MagicMock();room={'id':'room','owner_id':'u1','payload':{'poll':{'id':'keep'}}}
  with patch.object(z,'member',return_value=SimpleNamespace(id='u1')),patch.object(z,'db',return_value=client),patch.object(z,'room_for',return_value=room),patch.object(z,'execute',return_value=[room]),patch.object(z,'serialize',return_value={}):
   z.edit_schedule('room',z.ScheduleInput(revision=1,days=[{'date':'2026-10-20','stopIds':[]}]),None)
   self.assertEqual(client.table.return_value.update.call_args.args[0]['payload']['poll'],{'id':'keep'})
 def test_compare_and_swap_conflict(self):
  from unittest.mock import patch,MagicMock
  from types import SimpleNamespace
  from fastapi import HTTPException
  import zip_rooms as z
  with patch.object(z,'execute',return_value=[]):
   with self.assertRaises(HTTPException) as e:z.poll_write(MagicMock(),{'id':'room'},2,{},SimpleNamespace(id='u1'))
   self.assertEqual(e.exception.status_code,409)
if __name__=='__main__':unittest.main()
