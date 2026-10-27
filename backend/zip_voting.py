from course_traits import validate_trait_facts
"""Pure room poll transitions; votes stay server-side in room payload."""
from copy import deepcopy
from uuid import uuid4
from datetime import datetime,timezone,timedelta,date
class VoteError(Exception):
 def __init__(self,status,message):self.status=status;super().__init__(message)
def candidate(value):
 if not isinstance(value,dict):raise VoteError(422,'후보 코스를 확인해 주세요.')
 result={k:value.get(k) for k in ('id','name','region','transport','imagePlaceId')}
 if any(not isinstance(result[k],str) or not result[k].strip() or len(result[k])>200 for k in ('id','name','region')):raise VoteError(422,'후보 코스 정보를 확인해 주세요.')
 ids=value.get('stopIds');tags=value.get('tags',[])
 if not isinstance(ids,list) or not 2<=len(ids)<=100 or any(not isinstance(p,str) or not p or len(p)>200 for p in ids) or len(set(ids))!=len(ids):raise VoteError(422,'후보 장소를 확인해 주세요.')
 if result['transport'] not in ('도보','자동차','대중교통'):raise VoteError(422,'이동수단을 확인해 주세요.')
 if not isinstance(tags,list) or len(tags)>500 or any(not isinstance(t,str) or not t or len(t)>100 for t in tags):raise VoteError(422,'후보 태그를 확인해 주세요.')
 result['stopIds']=ids[:];result['tags']=list(dict.fromkeys(tags))[:3];result['imagePlaceId']=result['imagePlaceId'] if result['imagePlaceId'] in ids else ids[0]
 days=value.get('durationDays',1)
 if type(days) is not int or not 1<=days<=31:raise VoteError(422,'후보 여행 기간을 확인해 주세요.')
 result['durationDays']=days;mapping=value.get('stopDays',{});schedule=value.get('schedule') or []
 if not isinstance(mapping,dict) or not isinstance(schedule,list):raise VoteError(422,'후보 일정을 확인해 주세요.')
 result['stopDays']={};result['timings']={}
 import re,math
 for i,pid in enumerate(ids):
  entry=next((e for e in schedule if isinstance(e,dict) and e.get('placeId')==pid),None)
  if entry is None and i<len(schedule) and isinstance(schedule[i],dict):entry=schedule[i]
  entry=entry or {};day=mapping.get(pid,entry.get('day',1));time=entry.get('time','');minutes=entry.get('minutes',entry.get('duration_minutes',0))
  if type(day) is not int or not 1<=day<=days or not isinstance(time,str) or (time and not re.fullmatch(r'(?:[01]\d|2[0-3]):[0-5]\d',time)) or type(minutes) not in (int,float) or not math.isfinite(minutes) or not 0<=minutes<=1440:raise VoteError(422,'후보의 일차·시간을 확인해 주세요.')
  result['stopDays'][pid]=day;result['timings'][pid]={'time':time,'minutes':minutes}
 try:result['traitFacts']=validate_trait_facts(value.get('traitFacts')) or {}
 except ValueError:raise VoteError(422,'후보의 코스 성향 근거를 확인해 주세요.') from None
 return result

def start_poll(candidates,members,creator,previous=None):
 if previous and previous['status'] in ('active','tie'):raise VoteError(409,'진행 중인 투표를 먼저 완료해 주세요.')
 if not isinstance(candidates,list) or not 2<=len(candidates)<=10:raise VoteError(422,'투표 후보를 2~10개 선택해 주세요.')
 items=[candidate(c) for c in candidates]
 if len({c['id'] for c in items})!=len(items):raise VoteError(422,'같은 후보는 한 번만 선택해 주세요.')
 eligible=list(dict.fromkeys(members))
 if creator not in eligible:raise VoteError(403,'참여 멤버만 투표를 시작할 수 있습니다.')
 return {'id':str(uuid4()),'round':1,'status':'active','candidates':items,'eligible':eligible,'votes':{},'createdBy':creator,'createdAt':datetime.now(timezone.utc).isoformat(),'history':[]}

def results(poll):
 counts={c['id']:0 for c in poll['candidates']}
 for choice in poll['votes'].values():
  if choice in counts:counts[choice]+=1
 highest=max(counts.values(),default=0)
 leaders=[k for k,v in counts.items() if v==highest] if highest else []
 return counts,leaders

def cast_vote(poll,user,choice,poll_id,round):
 if not poll or poll['id']!=poll_id or poll['round']!=round:raise VoteError(409,'투표가 변경되었습니다. 최신 투표를 확인해 주세요.')
 if poll['status']!='active':raise VoteError(409,'이미 완료된 투표입니다.')
 if user not in poll['eligible']:raise VoteError(403,'이번 투표가 시작될 때 참여한 멤버만 투표할 수 있습니다.')
 if choice not in {c['id'] for c in poll['candidates']}:raise VoteError(422,'투표 후보를 선택해 주세요.')
 if user in poll['votes']:raise VoteError(409,'이미 투표했습니다. 다음 투표에 참여해 주세요.')
 next=deepcopy(poll);next['votes'][user]=choice
 if len(next['votes'])==len(next['eligible']):
  _,leaders=results(next);next['status']='tie' if len(leaders)>1 else 'completed';next['winnerId']=leaders[0] if len(leaders)==1 else None
 return next

def revote(poll,poll_id,round):
 if not poll or poll['id']!=poll_id or poll['round']!=round or poll['status']!='tie':raise VoteError(409,'동수표 결과를 다시 확인해 주세요.')
 next=deepcopy(poll);counts,leaders=results(next)
 next['history']=(next['history']+[{'round':next['round'],'counts':counts}])[-10:]
 next['candidates']=[c for c in next['candidates'] if c['id'] in leaders];next['round']+=1;next['votes']={};next['status']='active';next.pop('winnerId',None)
 return next

def restart_poll(poll,members,user,poll_id,round):
 if not poll or poll['id']!=poll_id or poll['round']!=round:raise VoteError(409,'투표가 변경되었습니다. 최신 투표를 확인해 주세요.')
 eligible=list(dict.fromkeys(members))
 if user not in eligible:raise VoteError(403,'현재 방 멤버만 투표를 다시 시작할 수 있습니다.')
 next=deepcopy(poll);counts,_=results(next)
 next['history']=(next.get('history',[])+[{'round':next['round'],'counts':counts}])[-10:]
 next['round']+=1;next['eligible']=eligible;next['votes']={};next['status']='active'
 for key in ('winnerId','appliedAt','appliedBy'):next.pop(key,None)
 next['restartedBy']=user;next['restartedAt']=datetime.now(timezone.utc).isoformat()
 return next

def withdraw_vote(poll,user,poll_id,round):
 if not poll or poll['id']!=poll_id or poll['round']!=round:raise VoteError(409,'투표가 변경되었습니다. 최신 투표를 확인해 주세요.')
 if poll.get('appliedAt'):raise VoteError(409,'이미 최종 일정에 적용한 투표는 변경할 수 없습니다.')
 if user not in poll['eligible']:raise VoteError(403,'이번 투표 대상 멤버만 다시 투표할 수 있습니다.')
 if user not in poll['votes']:raise VoteError(409,'아직 투표하지 않았습니다. 코스를 선택해 주세요.')
 next=deepcopy(poll);next['votes'].pop(user);next['status']='active';next.pop('winnerId',None)
 return next

def public_poll(poll,user):
 if not poll:return None
 counts,leaders=results(poll)
 return {k:deepcopy(poll[k]) for k in ('id','round','status','candidates','createdAt') if k in poll}|{'counts':counts,'leaders':leaders,'votedCount':len(poll['votes']),'eligibleCount':len(poll['eligible']),'canVote':user in poll['eligible'] and user not in poll['votes'] and poll['status']=='active','myVote':poll['votes'].get(user),'winnerId':poll.get('winnerId'),'applied':bool(poll.get('appliedAt'))}

def winning_schedule(poll,days,start_date):
 if not poll or poll['status']!='completed' or not poll.get('winnerId'):raise VoteError(409,'투표를 완료하고 단독 1위를 정해 주세요.')
 if poll.get('appliedAt'):raise VoteError(409,'이미 최종 일정에 적용한 투표입니다.')
 winner=next(c for c in poll['candidates'] if c['id']==poll['winnerId']);length=max(len(days),winner['durationDays']);start=date.fromisoformat(start_date)
 result=[]
 for index in range(length):
  ids=[p for p in winner['stopIds'] if winner['stopDays'][p]==index+1]
  result.append({'date':(start+timedelta(days=index)).isoformat(),'stopIds':ids,'timings':{p:winner['timings'][p] for p in ids}})
 return winner['name'][:30],result
