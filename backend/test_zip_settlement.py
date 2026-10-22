import unittest,random
from zip_settlement import *
MEMBERS=[{'id':str(i),'name':'멤버'+str(i)} for i in range(1,5)]
def raw(amount=120000,payer='1',ids=None):return {'title':'점심 식사','amount':amount,'payerId':payer,'participantIds':ids or ['1','2','3','4'],'date':'2026-10-20','category':'식비','note':'','placeId':None}
def expense(amount=120000,payer='1',ids=None):return validate_expense(raw(amount,payer,ids),MEMBERS,[])
class SettlementTests(unittest.TestCase):
 def test_even_split(self):self.assertEqual(shares(expense()),dict.fromkeys(['1','2','3','4'],30000))
 def test_remainder_stable_member_order(self):
  e=expense(100,'2',['4','3','2']);self.assertEqual(e['participantIds'],['2','3','4']);self.assertEqual(shares(e),{'2':34,'3':33,'4':33})
 def test_one_won(self):self.assertEqual(sum(shares(expense(1)).values()),1)
 def test_payer_must_participate(self):
  with self.assertRaises(ExpenseError):expense(100,'1',['2','3'])
 def test_invalid_amounts(self):
  for n in (0,-1,True,1.5,1000000000,'100'):
   with self.subTest(amount=n),self.assertRaises(ExpenseError):expense(n)
 def test_invalid_members_and_duplicates(self):
  for ids in (['1','missing'],['1','1']):
   with self.assertRaises(ExpenseError):expense(100,'1',ids)
 def test_invalid_dates_and_place(self):
  for patch in ({'date':'2026-02-30'},{'date':'2026-W43-2'},{'placeId':'not-scheduled'}):
   with self.assertRaises(ExpenseError):validate_expense({**raw(),**patch},MEMBERS,[])
 def test_snapshots_historical_member(self):
  e=expense();changed=validate_expense(raw(),MEMBERS[1:],[],e);self.assertIn('1',changed['participantIds'])
 def test_total_and_balances_conserved(self):
  s=settlement([expense(),expense(25000,'2',['2','3','4'])],MEMBERS);self.assertEqual(s['total'],145000);self.assertEqual(sum(p['share'] for p in s['people']),145000);self.assertEqual(sum(p['balance'] for p in s['people']),0)
 def test_transfers_clear_every_balance(self):
  s=settlement([expense(),expense(25000,'2',['2','3','4'])],MEMBERS);balances={p['id']:p['balance'] for p in s['people']}
  for t in s['transfers']:balances[t['fromId']]+=t['amount'];balances[t['toId']]-=t['amount'];self.assertGreater(t['amount'],0)
  self.assertTrue(all(v==0 for v in balances.values()))
 def test_zero_and_self_only(self):
  self.assertEqual(settlement([],MEMBERS)['transfers'],[]);self.assertEqual(settlement([expense(5000,'1',['1'])],MEMBERS)['transfers'],[])
 def test_minimum_number_pairing(self):
  plan,minimum=transfer_plan({'a':-4,'b':-3,'c':-3,'d':6,'e':4});self.assertTrue(minimum);self.assertEqual(len(plan),3)
 def test_random_conservation(self):
  rng=random.Random(4)
  for _ in range(50):
   records=[]
   for j in range(8):
    ids=rng.sample(['1','2','3','4'],rng.randint(1,4));records.append(expense(rng.randint(1,200000),ids[0],ids))
   s=settlement(records,MEMBERS);b={p['id']:p['balance'] for p in s['people']}
   for t in s['transfers']:b[t['fromId']]+=t['amount'];b[t['toId']]-=t['amount']
   self.assertTrue(all(v==0 for v in b.values()));self.assertEqual(sum(p['share'] for p in s['people']),s['total'])
if __name__=='__main__':unittest.main()
