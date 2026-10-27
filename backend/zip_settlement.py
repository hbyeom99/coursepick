"""Integer-only shared travel expense allocation and settlement."""
from datetime import date,datetime,timezone
from copy import deepcopy
import re
from uuid import uuid4
from time import monotonic
class ExpenseError(Exception):
 def __init__(self,status,message):self.status=status;super().__init__(message)
CATEGORIES=('식비','카페','관광','숙박','택시비','주차비','통행료','기타')
def validate_expense(value,members,days,old=None):
 if not isinstance(value,dict):raise ExpenseError(422,'지출 정보를 확인해 주세요.')
 title=value.get('title');amount=value.get('amount');payer=value.get('payerId');participants=value.get('participantIds');day=value.get('date');category=value.get('category','기타');note=value.get('note','');place=value.get('placeId')
 if not isinstance(title,str) or not 1<=len(title.strip())<=80 or type(amount) is not int or not 1<=amount<=999999999:raise ExpenseError(422,'항목명과 원 단위 정수 금액을 확인해 주세요.')
 if not isinstance(day,str) or not re.fullmatch(r'\d{4}-\d{2}-\d{2}',day):raise ExpenseError(422,'지출 날짜를 확인해 주세요.')
 try:date.fromisoformat(day)
 except ValueError:raise ExpenseError(422,'지출 날짜를 확인해 주세요.') from None
 people={m['id']:m['name'] for m in members}
 # Existing historical participants survive a later membership change, without accepting client-supplied identities.
 for person in (old or {}).get('people',[]):people.setdefault(person['id'],person['name'])
 if not isinstance(participants,list) or not participants or len(participants)>100 or any(not isinstance(p,str) or p not in people for p in participants) or len(set(participants))!=len(participants) or payer not in participants:raise ExpenseError(422,'결제자를 포함한 정산 참여 인원을 선택해 주세요.')
 if category not in CATEGORIES or not isinstance(note,str) or len(note)>500:raise ExpenseError(422,'지출 분류와 메모를 확인해 주세요.')
 if place is not None:
  scheduled={p for d in days for p in d.get('stopIds',[])}|{'k:'+ref['placeId'] for d in days for ref in d.get('kakaoPlaceRefs',[])}
  if not isinstance(place,str) or (place not in scheduled and place!=(old or {}).get('placeId')):raise ExpenseError(422,'방의 여행 장소를 선택하거나 기타 지출로 등록해 주세요.')
 # Keep a stable server-owned member order for 1-won remainders.
 ids=[pid for pid in people if pid in participants]
 return {'id':(old or {}).get('id') or str(uuid4()),'title':title.strip(),'amount':amount,'payerId':payer,'participantIds':ids,'people':[{'id':p,'name':people[p]} for p in ids],'date':day,'category':category,'note':note.strip(),'placeId':place,'placeName':(old or {}).get('placeName','') if place else '', 'createdAt':(old or {}).get('createdAt') or datetime.now(timezone.utc).isoformat()}

def shares(expense):
 ids=expense['participantIds'];base,remainder=divmod(expense['amount'],len(ids));return {pid:base+(i<remainder) for i,pid in enumerate(ids)}

def transfer_plan(balances):
 debt=[[p,-n] for p,n in balances.items() if n<0];credit=[[p,n] for p,n in balances.items() if n>0]
 debt.sort(key=lambda x:(-x[1],x[0]));credit.sort(key=lambda x:(-x[1],x[0]));greedy=[];a=deepcopy(debt);b=deepcopy(credit);i=j=0
 while i<len(a) and j<len(b):
  amount=min(a[i][1],b[j][1]);greedy.append({'fromId':a[i][0],'toId':b[j][0],'amount':amount});a[i][1]-=amount;b[j][1]-=amount
  if not a[i][1]:i+=1
  if not b[j][1]:j+=1
 if not greedy:return [],True
 # Search direct debtor-to-creditor matches; timeout retains a valid simplified plan.
 best=greedy;deadline=monotonic()+.08;timed_out=False
 def search(ds,cs,path):
  nonlocal best,timed_out
  if monotonic()>deadline:timed_out=True;return
  ds=[v for v in ds if v[1]];cs=[v for v in cs if v[1]]
  if not ds:
   if len(path)<len(best):best=path[:]
   return
  if len(path)+max(len(ds),len(cs))>=len(best):return
  p,n=ds[0];seen=set()
  for index,(q,m) in enumerate(cs):
   if m in seen:continue
   seen.add(m);amount=min(n,m);nd=deepcopy(ds);nc=deepcopy(cs);nd[0][1]-=amount;nc[index][1]-=amount
   search(nd,nc,path+[{'fromId':p,'toId':q,'amount':amount}])
 if len(debt)+len(credit)<=16:search(deepcopy(debt),deepcopy(credit),[])
 else:timed_out=True
 return best,not timed_out

def settlement(expenses,members):
 people={m['id']:m['name'] for m in members};paid={p:0 for p in people};owed={p:0 for p in people}
 for e in expenses:
  for p in e['people']:people.setdefault(p['id'],p['name']);paid.setdefault(p['id'],0);owed.setdefault(p['id'],0)
  paid[e['payerId']]+=e['amount']
  for pid,value in shares(e).items():owed[pid]+=value
 balances={pid:paid[pid]-owed[pid] for pid in people};transfers,minimum=transfer_plan(balances)
 return {'total':sum(e['amount'] for e in expenses),'expenseCount':len(expenses),'people':[{'id':p,'name':people[p],'paid':paid[p],'share':owed[p],'balance':balances[p]} for p in people],'transfers':transfers,'minimumTransfers':minimum}
