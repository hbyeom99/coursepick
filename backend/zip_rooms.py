from kakao_refs import validate_kakao_refs
from zip_schedule_details import validate_zip_stop_details
from course_traits import validate_trait_facts
"""Authenticated Zip room collaboration. No public or cross-room access."""
import hashlib
import json
import re
import secrets
from datetime import date, datetime, timezone
from uuid import UUID
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field
from member_accounts import member, db, config
from zip_invite_code import room_invite_code

from zip_settlement import ExpenseError,validate_expense,settlement
from zip_voting import VoteError,start_poll,cast_vote,revote,restart_poll,withdraw_vote,public_poll,winning_schedule

router=APIRouter(prefix='/api/zip')
AXES=('planning','experience','exploration','spending')

def uid(value):
 try:return str(UUID(str(value)))
 except Exception:raise HTTPException(422,'방 또는 회원 정보를 확인해 주세요.') from None

def execute(query):
 try:return query.execute().data
 except Exception as error:
  if getattr(error,'code','')=='PGRST205':raise HTTPException(503,'Zip 공유 설정이 아직 준비되지 않았습니다.') from None
  raise HTTPException(503,'방 정보를 처리하지 못했습니다. 다시 시도해 주세요.') from None

def room_for(client,room_id,user):
 rows=execute(client.table('zip_rooms').select('*').eq('id',uid(room_id)).limit(1))
 if not rows:raise HTTPException(404,'방을 찾을 수 없습니다.')
 room=rows[0]
 if room['owner_id']!=str(user.id) and not execute(client.table('zip_room_members').select('user_id').eq('room_id',room['id']).eq('user_id',str(user.id)).limit(1)):
  raise HTTPException(403,'이 방에 참여한 회원만 볼 수 있습니다.')
 return room

def profile_summary(client,user_id):
 rows=execute(client.table('member_data').select('value').eq('user_id',user_id).eq('data_key','coursepick.profile.v1').limit(1))
 value=rows[0].get('value') if rows else None
 name=value['name'].strip()[:20] if isinstance(value,dict) and isinstance(value.get('name'),str) and value['name'].strip() else '여행자'
 if name=='여행자':
  try:
   account=client.auth.admin.get_user_by_id(user_id).user
   nickname=(getattr(account,'user_metadata',None) or {}).get('nickname')
   if isinstance(nickname,str) and nickname.strip():name=nickname.strip()[:20]
  except Exception:pass
 photo=None
 path=value.get('photoPath') if isinstance(value,dict) else None
 if isinstance(path,str) and path.startswith(user_id+'/'):
  try:photo=client.storage.from_('member-avatars').create_signed_url(path,3600)['signedURL']
  except Exception:pass
 return name,photo

def profile_name(client,user_id):
 return profile_summary(client,user_id)[0]

def serialize(client,room,user_id=None):
 members=execute(client.table('zip_room_members').select('user_id,taste,keywords').eq('room_id',room['id']).order('joined_at').order('user_id'))
 people=[]
 for m in members:
  name,photo=profile_summary(client,m['user_id'])
  saved=execute(client.table('member_data').select('value').eq('user_id',m['user_id']).eq('data_key','coursepick.travelTaste.v1').limit(1))
  candidate=saved[0].get('value') if saved else None
  from travel_journal_validation import validate_travel_taste
  try:taste=validate_travel_taste(candidate)
  except ValueError:taste=None
  people.append({'id':m['user_id'],'name':name,'photo':photo,'taste':taste,'keywords':m.get('keywords') or []})
 image=''
 if room.get('image_path'):
  try:image=client.storage.from_('member-avatars').create_signed_url(room['image_path'],3600)['signedURL']
  except Exception:pass
 payload=room.get('payload') or {}
 return {'id':room['id'],'ownerId':room['owner_id'],'name':room['name'],'description':room['description'],'region':room['region'],'startDate':room['start_date'],'endDate':room['end_date'],'image':image,'imagePath':room.get('image_path'),'members':people,'scheduleTitle':payload.get('title',''),'transport':payload.get('transport','도보'),'days':payload.get('days',[]),'revision':room['revision'],'poll':public_poll(payload.get('poll'),str(user_id) if user_id else ''),'expenses':[e for e in payload.get('expenses',[]) if not e.get('deletedAt')],'traitFacts':payload.get('traitFacts',{})}

class RoomInput(BaseModel):
 name:str=Field(min_length=1,max_length=20)
 description:str=Field(default='',max_length=100)
 region:str=Field(min_length=1,max_length=30)
 startDate:date
 endDate:date
 imagePath:str|None=None
 revision:int|None=Field(default=None,ge=0)

def room_values(body,user):
 if not body.name.strip() or not body.region.strip() or not 0<=(body.endDate-body.startDate).days<=30:raise HTTPException(422,'방 이름, 지역과 여행 기간을 확인해 주세요.')
 if body.imagePath and not body.imagePath.startswith(str(user.id)+'/'):raise HTTPException(422,'대표 이미지를 다시 선택해 주세요.')
 return {'name':body.name.strip(),'description':body.description.strip(),'region':body.region.strip(),'start_date':body.startDate.isoformat(),'end_date':body.endDate.isoformat(),'image_path':body.imagePath}

@router.get('/rooms')
def rooms(authorization:str|None=Header(None)):
 user=member(authorization);client=db()
 memberships=execute(client.table('zip_room_members').select('room_id').eq('user_id',str(user.id)))
 ids=[m['room_id'] for m in memberships]
 result=[]
 for start in range(0,len(ids),100):
  result.extend(execute(client.table('zip_rooms').select('*').in_('id',ids[start:start+100]).order('created_at',desc=True)))
 incoming=execute(client.table('zip_room_invites').select('id,room_id,created_by').eq('recipient_id',str(user.id)).gt('expires_at',datetime.now(timezone.utc).isoformat()))
 invites=[]
 for invite in incoming:
  if invite['room_id'] in ids:continue
  r=execute(client.table('zip_rooms').select('id,name,region').eq('id',invite['room_id']).limit(1))
  if r:invites.append({'id':invite['id'],'room':r[0]})
 return {'rooms':[serialize(client,r,str(user.id)) for r in result],'invitations':invites}

@router.post('/rooms')
def create(body:RoomInput,authorization:str|None=Header(None)):
 user=member(authorization);client=db();value=room_values(body,user)
 from datetime import timedelta
 days=[{'date':(body.startDate+timedelta(days=i)).isoformat(),'stopIds':[]} for i in range((body.endDate-body.startDate).days+1)]
 value['payload']={'title':'','days':days}
 new_id=execute(client.rpc('zip_create_room',{'room':value,'creator':str(user.id)}))
 return serialize(client,room_for(client,new_id,user),str(user.id))

@router.get('/rooms/{room_id}')
def get_room(room_id:str,authorization:str|None=Header(None)):
 user=member(authorization);client=db();return serialize(client,room_for(client,room_id,user),str(user.id))

@router.put('/rooms/{room_id}')
def edit_room(room_id:str,body:RoomInput,authorization:str|None=Header(None)):
 user=member(authorization);client=db();room=room_for(client,room_id,user)
 if room['owner_id']!=str(user.id):raise HTTPException(403,'방 정보 수정은 방장만 할 수 있습니다.')
 value=room_values(body,user)
 if body.revision is None:raise HTTPException(422,'최신 방 정보로 다시 시도해 주세요.')
 if body.startDate.isoformat()!=room['start_date'] or body.endDate.isoformat()!=room['end_date']:
  from datetime import timedelta
  old={d['date']:d for d in room.get('payload',{}).get('days',[])}
  dates=[(body.startDate+timedelta(days=i)).isoformat() for i in range((body.endDate-body.startDate).days+1)]
  if any(d.get('stopIds') or d.get('kakaoPlaceRefs') for key,d in old.items() if key not in dates):raise HTTPException(422,'장소가 있는 날짜는 최종 일정에서 먼저 정리해 주세요.')
  value['payload']={**room.get('payload',{}),'days':[old.get(d,{'date':d,'stopIds':[]}) for d in dates]}
 value['revision']=body.revision+1
 rows=execute(client.table('zip_rooms').update(value).eq('id',room['id']).eq('revision',body.revision))
 if not rows:raise HTTPException(409,'다른 멤버가 수정했습니다. 최신 정보를 확인해 주세요.')
 return serialize(client,room_for(client,room_id,user),str(user.id))

@router.delete('/rooms/{room_id}')
def delete_room(room_id:str,authorization:str|None=Header(None)):
 user=member(authorization);client=db();room=room_for(client,room_id,user)
 if room['owner_id']!=str(user.id):raise HTTPException(403,'방 삭제는 방장만 할 수 있습니다.')
 execute(client.table('zip_rooms').delete().eq('id',room['id']).eq('owner_id',str(user.id)))
 return {'ok':True}

@router.delete('/rooms/{room_id}/me')
def leave_room(room_id:str,authorization:str|None=Header(None)):
 user=member(authorization);client=db();room=room_for(client,room_id,user)
 if room['owner_id']==str(user.id):raise HTTPException(403,'방장은 방 삭제 메뉴를 이용해 주세요.')
 execute(client.table('zip_room_members').delete().eq('room_id',room['id']).eq('user_id',str(user.id)))
 return {'ok':True}

class MemberInput(BaseModel):
 taste:dict|None=None
 keywords:list[str]=Field(default_factory=list,max_length=50)

@router.put('/rooms/{room_id}/me')
def edit_member(room_id:str,body:MemberInput,authorization:str|None=Header(None)):
 user=member(authorization);client=db();room=room_for(client,room_id,user)
 if body.taste is not None and (set(body.taste)!=set(AXES) or any(type(v) not in (int,float) or not 0<=v<=100 for v in body.taste.values())):raise HTTPException(422,'성향 점수는 축마다 0~100점으로 입력해 주세요.')
 if any(not k.strip() or len(k)>100 for k in body.keywords):raise HTTPException(422,'키워드를 확인해 주세요.')
 execute(client.table('zip_room_members').update({'taste':body.taste,'keywords':list(dict.fromkeys(body.keywords))}).eq('room_id',room['id']).eq('user_id',str(user.id)))
 return serialize(client,room_for(client,room_id,user),str(user.id))

class ScheduleInput(BaseModel):
 revision:int=Field(ge=0)
 title:str=Field(default='',max_length=30)
 days:list=Field(max_length=31)
 transport:str='도보'
 traitFacts:dict|None=None

@router.put('/rooms/{room_id}/schedule')
def edit_schedule(room_id:str,body:ScheduleInput,authorization:str|None=Header(None)):
 user=member(authorization);client=db();room=room_for(client,room_id,user)
 dates=[];ids=[]
 if body.transport not in ('도보','자동차','대중교통'):raise HTTPException(422,'이동수단을 확인해 주세요.')
 for day in body.days:
  if not isinstance(day,dict) or not isinstance(day.get('stopIds'),list) or len(day['stopIds'])>100:raise HTTPException(422,'일정 형식을 확인해 주세요.')
  try:date.fromisoformat(day['date'])
  except Exception:raise HTTPException(422,'여행 날짜를 확인해 주세요.') from None
  if any(not isinstance(pid,str) or not pid or len(pid)>200 for pid in day['stopIds']) or len(set(day['stopIds']))!=len(day['stopIds']):raise HTTPException(422,'여행 장소를 확인해 주세요.')
  try:day['kakaoPlaceRefs']=validate_kakao_refs(day.get('kakaoPlaceRefs'))
  except ValueError:raise HTTPException(422,'카카오 장소 참조를 확인해 주세요.') from None
  allowed={'n:'+pid for pid in day['stopIds']}|{'k:'+ref['placeId'] for ref in day['kakaoPlaceRefs']}
  order=day.get('itineraryOrder',[])
  if not isinstance(order,list) or len(order)>120 or any(not isinstance(key,str) for key in order) or len(set(order))!=len(order):raise HTTPException(422,'방문 순서를 확인해 주세요.')
  day['itineraryOrder']=[key for key in order if key in allowed]
  timings=day.get('timings',{})
  if not isinstance(timings,dict) or any(pid not in day['stopIds'] or not isinstance(t,dict) or (t.get('time','') and not re.fullmatch(r'(?:[01]\d|2[0-3]):[0-5]\d',str(t['time']))) or type(t.get('minutes',0)) not in (int,float) or not 0<=t.get('minutes',0)<=1440 for pid,t in timings.items()):raise HTTPException(422,'방문 시간과 체류 시간을 확인해 주세요.')
  previous_day=next((d for d in (room.get('payload') or {}).get('days',[]) if d.get('date')==day['date']),{})
  try:day['stopDetails']=validate_zip_stop_details(day.get('stopDetails',previous_day.get('stopDetails',{})),allowed)
  except ValueError:raise HTTPException(422,'방문 시간과 메모를 확인해 주세요.') from None
  dates.append(day['date']);ids.extend(day['stopIds'])
 if not dates or dates!=sorted(set(dates)):raise HTTPException(422,'일차의 날짜 순서를 확인해 주세요.')
 if (date.fromisoformat(dates[-1])-date.fromisoformat(dates[0])).days>30:raise HTTPException(422,'여행 기간은 최대 31일입니다.')
 from member_course_validation import known_places
 if not set(ids).issubset(known_places(client,sorted(set(ids)))):raise HTTPException(422,'등록되지 않은 장소가 포함되어 있습니다.')
 try:trait_facts=validate_trait_facts(body.traitFacts) if 'traitFacts' in body.model_fields_set else (room.get('payload') or {}).get('traitFacts',{})
 except ValueError:raise HTTPException(422,'코스 성향 근거를 확인해 주세요.') from None
 if (trait_facts or {}).get('reservationRequiredCount',0)>len(ids) and trait_facts!=(room.get('payload') or {}).get('traitFacts',{}):raise HTTPException(422,'예약 장소 수는 방문 장소 수 이하여야 합니다.')
 rows=execute(client.table('zip_rooms').update({'payload':{**(room.get('payload') or {}),'traitFacts':trait_facts or {},'title':body.title,'transport':body.transport,'days':[{'date':d['date'],'stopIds':d['stopIds'],'kakaoPlaceRefs':d['kakaoPlaceRefs'],'itineraryOrder':d['itineraryOrder'],'stopDetails':d['stopDetails'],'timings':{pid:{'time':t.get('time',''),'minutes':t.get('minutes',0)} for pid,t in d.get('timings',{}).items()}} for d in body.days]},'revision':body.revision+1,'start_date':dates[0],'end_date':dates[-1]}).eq('id',room['id']).eq('revision',body.revision))
 if not rows:raise HTTPException(409,'다른 멤버가 일정을 수정했습니다. 최신 일정으로 다시 확인해 주세요.')
 return serialize(client,rows[0],str(user.id))

@router.get('/people')
def people(query:str='',authorization:str|None=Header(None)):
 user=member(authorization);query=query.strip().replace('%','').replace('_','')
 if not 2<=len(query)<=20:return {'people':[]}
 rows=execute(db().table('member_data').select('user_id,value').eq('data_key','coursepick.profile.v1').ilike('value->>name','%'+query+'%').limit(10))
 return {'people':[{'id':r['user_id'],'name':r['value']['name'][:20]} for r in rows if r['user_id']!=str(user.id) and isinstance(r.get('value'),dict) and isinstance(r['value'].get('name'),str)]}

class ShareInput(BaseModel):
 userId:str|None=None

@router.post('/rooms/{room_id}/invites')
def invite(room_id:str,body:ShareInput,authorization:str|None=Header(None)):
 user=member(authorization);client=db();room=room_for(client,room_id,user)
 if not body.userId:return room_invite_code(client,execute,room['id'],str(user.id),config()[1])
 token=secrets.token_urlsafe(32)
 value={'room_id':room['id'],'created_by':str(user.id),'token_hash':hashlib.sha256(token.encode()).hexdigest()}
 if body.userId:
  recipient=uid(body.userId)
  if not execute(client.table('member_data').select('user_id').eq('user_id',recipient).eq('data_key','coursepick.profile.v1').limit(1)):raise HTTPException(404,'초대할 회원을 찾을 수 없습니다.')
  value['recipient_id']=recipient
 row=execute(client.table('zip_room_invites').insert(value))[0]
 return {'inviteId':row['id'],'token':token,'expiresAt':row['expires_at']}

class JoinInput(BaseModel):
 token:str|None=Field(default=None,max_length=100)
 inviteId:str|None=None

def invited_room(client,body,user):
 query=client.table('zip_room_invites').select('*').gt('expires_at',datetime.now(timezone.utc).isoformat())
 if body.token:
  token=body.token.strip()
  if re.fullmatch(r'[A-Za-z0-9]{6}',token):token=token.upper()
  query=query.eq('token_hash',hashlib.sha256(token.encode()).hexdigest())
 elif body.inviteId and user is not None:query=query.eq('id',uid(body.inviteId)).eq('recipient_id',str(user.id))
 else:raise HTTPException(422,'초대 정보를 확인해 주세요.')
 rows=execute(query.limit(1))
 if not rows or (user is not None and rows[0].get('recipient_id') not in (None,str(user.id))):raise HTTPException(404,'초대 링크가 만료되었거나 사용할 수 없습니다.')
 return rows[0]

@router.post('/invite-preview')
def preview_invite(body:JoinInput,authorization:str|None=Header(None)):
 user=member(authorization) if authorization else None;client=db();invite=invited_room(client,body,user)
 rows=execute(client.table('zip_rooms').select('*').eq('id',invite['room_id']).limit(1))
 if not rows:raise HTTPException(404,'방을 찾을 수 없습니다.')
 value=serialize(client,rows[0],str(user.id) if user else None)
 return {key:value[key] for key in ('id','name','description','region','image')}|{'memberCount':len(value['members']),'members':[{'name':m['name']} for m in value['members'][:4]]}

@router.post('/join')
def join(body:JoinInput,authorization:str|None=Header(None)):
 user=member(authorization);client=db();invite=invited_room(client,body,user)
 room_id=invite['room_id']
 execute(client.table('zip_room_members').upsert({'room_id':room_id,'user_id':str(user.id)},on_conflict='room_id,user_id',ignore_duplicates=True))
 return serialize(client,room_for(client,room_id,user),str(user.id))


class PollStart(BaseModel):
 revision:int=Field(ge=0)
 candidates:list[dict]=Field(min_length=2,max_length=10)
class PollAction(BaseModel):
 revision:int=Field(ge=0)
 pollId:str=Field(max_length=100)
 round:int=Field(ge=1)
 courseId:str|None=Field(default=None,max_length=200)

def poll_write(client,room,revision,payload,user,extra=None):
 rows=execute(client.table('zip_rooms').update({'payload':payload,'revision':revision+1,**(extra or {})}).eq('id',room['id']).eq('revision',revision))
 if not rows:raise HTTPException(409,'다른 멤버가 변경했습니다. 최신 방 정보를 확인하고 다시 시도해 주세요.')
 return serialize(client,rows[0],str(user.id))

def check_poll_revision(room,revision):
 if room['revision']!=revision:raise HTTPException(409,'최신 방 정보를 확인하고 다시 시도해 주세요.')

@router.post('/rooms/{room_id}/poll')
def create_poll(room_id:str,body:PollStart,authorization:str|None=Header(None)):
 user=member(authorization);client=db();room=room_for(client,room_id,user);check_poll_revision(room,body.revision)
 payload=dict(room.get('payload') or {})
 members=execute(client.table('zip_room_members').select('user_id').eq('room_id',room['id']))
 try:poll=start_poll(body.candidates,[m['user_id'] for m in members],str(user.id),payload.get('poll'))
 except VoteError as e:raise HTTPException(e.status,str(e)) from None
 from member_course_validation import known_places
 ids=sorted({p for c in poll['candidates'] for p in c['stopIds']})
 if not set(ids).issubset(known_places(client,ids)):raise HTTPException(422,'후보에 등록되지 않은 장소가 포함되어 있습니다.')
 payload['poll']=poll
 return poll_write(client,room,body.revision,payload,user)

@router.post('/rooms/{room_id}/poll/vote')
def vote_poll(room_id:str,body:PollAction,authorization:str|None=Header(None)):
 user=member(authorization);client=db();room=room_for(client,room_id,user);check_poll_revision(room,body.revision);payload=dict(room.get('payload') or {})
 try:payload['poll']=cast_vote(payload.get('poll'),str(user.id),body.courseId,body.pollId,body.round)
 except VoteError as e:raise HTTPException(e.status,str(e)) from None
 return poll_write(client,room,body.revision,payload,user)

@router.post('/rooms/{room_id}/poll/restart')
def restart_room_poll(room_id:str,body:PollAction,authorization:str|None=Header(None)):
 user=member(authorization);client=db();room=room_for(client,room_id,user);check_poll_revision(room,body.revision)
 payload=dict(room.get('payload') or {})
 members=execute(client.table('zip_room_members').select('user_id').eq('room_id',room['id']))
 try:payload['poll']=restart_poll(payload.get('poll'),[m['user_id'] for m in members],str(user.id),body.pollId,body.round)
 except VoteError as e:raise HTTPException(e.status,str(e)) from None
 return poll_write(client,room,body.revision,payload,user)

@router.post('/rooms/{room_id}/poll/reset-candidates')
def reset_poll_candidates(room_id:str,body:PollAction,authorization:str|None=Header(None)):
 user=member(authorization);client=db();room=room_for(client,room_id,user);check_poll_revision(room,body.revision)
 payload=dict(room.get('payload') or {})
 members=execute(client.table('zip_room_members').select('user_id').eq('room_id',room['id']))
 try:restart_poll(payload.get('poll'),[m['user_id'] for m in members],str(user.id),body.pollId,body.round)
 except VoteError as e:raise HTTPException(e.status,str(e)) from None
 payload.pop('poll',None)
 return poll_write(client,room,body.revision,payload,user)

@router.post('/rooms/{room_id}/poll/reselect')
def reselect_poll(room_id:str,body:PollAction,authorization:str|None=Header(None)):
 user=member(authorization);client=db();room=room_for(client,room_id,user);check_poll_revision(room,body.revision);payload=dict(room.get('payload') or {})
 try:payload['poll']=withdraw_vote(payload.get('poll'),str(user.id),body.pollId,body.round)
 except VoteError as e:raise HTTPException(e.status,str(e)) from None
 return poll_write(client,room,body.revision,payload,user)

@router.post('/rooms/{room_id}/poll/revote')
def revote_poll(room_id:str,body:PollAction,authorization:str|None=Header(None)):
 user=member(authorization);client=db();room=room_for(client,room_id,user);check_poll_revision(room,body.revision);payload=dict(room.get('payload') or {})
 try:payload['poll']=revote(payload.get('poll'),body.pollId,body.round)
 except VoteError as e:raise HTTPException(e.status,str(e)) from None
 return poll_write(client,room,body.revision,payload,user)

@router.post('/rooms/{room_id}/poll/apply')
def apply_poll(room_id:str,body:PollAction,authorization:str|None=Header(None)):
 user=member(authorization);client=db();room=room_for(client,room_id,user);check_poll_revision(room,body.revision);payload=dict(room.get('payload') or {});poll=payload.get('poll')
 if not poll or poll['id']!=body.pollId or poll['round']!=body.round:raise HTTPException(409,'최신 투표 결과를 확인해 주세요.')
 try:title,days=winning_schedule(poll,payload.get('days',[]),room['start_date'])
 except VoteError as e:raise HTTPException(e.status,str(e)) from None
 from member_course_validation import known_places
 ids=sorted({p for d in days for p in d['stopIds']})
 if not set(ids).issubset(known_places(client,ids)):raise HTTPException(422,'선택한 코스의 장소 정보를 다시 확인해 주세요.')
 payload['title']=room['name'];payload['days']=days;payload['traitFacts']=next(c for c in poll['candidates'] if c['id']==poll['winnerId']).get('traitFacts',{});payload['poll']={**poll,'appliedAt':datetime.now(timezone.utc).isoformat(),'appliedBy':str(user.id)}
 return poll_write(client,room,body.revision,payload,user,{'end_date':days[-1]['date']})


class ExpenseInput(BaseModel):
 revision:int=Field(ge=0)
 expense:dict
class ExpenseDelete(BaseModel):
 revision:int=Field(ge=0)

def expense_people(client,room):
 rows=execute(client.table('zip_room_members').select('user_id').eq('room_id',room['id']).order('joined_at').order('user_id'))
 return [{'id':m['user_id'],'name':profile_name(client,m['user_id'])} for m in rows]

def expense_value(client,room,body,old,user):
 try:value=validate_expense(body.expense,expense_people(client,room),(room.get('payload') or {}).get('days',[]),old)
 except ExpenseError as e:raise HTTPException(e.status,str(e)) from None
 if value['placeId']:
  if old and old.get('placeId')==value['placeId']:value['placeName']=old.get('placeName','')
  elif value['placeId'].startswith('k:'):
   value['placeName']='' # Resolve provider names at display time; persist only the schedule reference.
  else:
   places=execute(client.table('places').select('id,name').eq('id',value['placeId']).limit(1))
   if not places:raise HTTPException(422,'장소 정보를 확인할 수 없습니다. 기타 지출로 등록해 주세요.')
   value['placeName']=places[0]['name']
 value['updatedAt']=datetime.now(timezone.utc).isoformat();value['updatedBy']=str(user.id);value['createdBy']=(old or {}).get('createdBy') or str(user.id)
 return value

@router.post('/rooms/{room_id}/expenses')
def add_expense(room_id:str,body:ExpenseInput,authorization:str|None=Header(None)):
 user=member(authorization);client=db();room=room_for(client,room_id,user);check_poll_revision(room,body.revision);payload=dict(room.get('payload') or {});items=list(payload.get('expenses',[]));new_id=uid(body.expense.get('id'))
 if len(items)>=500:raise HTTPException(422,'한 방에는 최대 500개 지출을 등록할 수 있습니다.')
 if any(e['id']==new_id for e in items):raise HTTPException(409,'이미 등록된 지출입니다. 내역을 확인해 주세요.')
 value=expense_value(client,room,body,None,user);value['id']=new_id;payload['expenses']=[*items,value]
 return poll_write(client,room,body.revision,payload,user)

@router.put('/rooms/{room_id}/expenses/{expense_id}')
def edit_expense(room_id:str,expense_id:str,body:ExpenseInput,authorization:str|None=Header(None)):
 user=member(authorization);client=db();room=room_for(client,room_id,user);check_poll_revision(room,body.revision);payload=dict(room.get('payload') or {});items=payload.get('expenses',[]);old=next((e for e in items if e['id']==uid(expense_id) and not e.get('deletedAt')),None)
 if not old:raise HTTPException(404,'지출 내역을 찾을 수 없습니다.')
 value=expense_value(client,room,body,old,user);payload['expenses']=[value if e['id']==old['id'] else e for e in items]
 return poll_write(client,room,body.revision,payload,user)

@router.delete('/rooms/{room_id}/expenses/{expense_id}')
def delete_expense(room_id:str,expense_id:str,body:ExpenseDelete,authorization:str|None=Header(None)):
 user=member(authorization);client=db();room=room_for(client,room_id,user);check_poll_revision(room,body.revision);payload=dict(room.get('payload') or {});items=payload.get('expenses',[])
 if not any(e['id']==uid(expense_id) and not e.get('deletedAt') for e in items):raise HTTPException(404,'지출 내역을 찾을 수 없습니다.')
 payload['expenses']=[{**e,'deletedAt':datetime.now(timezone.utc).isoformat(),'deletedBy':str(user.id)} if e['id']==expense_id else e for e in items]
 return poll_write(client,room,body.revision,payload,user)

@router.get('/rooms/{room_id}/settlement')
def expense_settlement(room_id:str,authorization:str|None=Header(None)):
 user=member(authorization);client=db();room=room_for(client,room_id,user)
 expenses=[e for e in (room.get('payload') or {}).get('expenses',[]) if not e.get('deletedAt')]
 return {'revision':room['revision'],'result':settlement(expenses,expense_people(client,room)),'room':serialize(client,room,str(user.id))}
