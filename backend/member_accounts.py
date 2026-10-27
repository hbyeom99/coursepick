from report_saved_dates import DATE_KEY, TRACKED_KEYS, course_ids as report_course_ids, next_dates
from datetime import datetime, timezone
from editorial_copy_validation import validate_editorial_copies
import json
from title_filter import validate_course_title
import os
import re
from pathlib import Path
from urllib.request import Request,urlopen
from urllib.error import HTTPError
from dotenv import dotenv_values
from fastapi import APIRouter,Header,HTTPException
from pydantic import BaseModel,Field
from supabase import create_client
from travel_journal_validation import validate_journals, validate_travel_taste
from google_refs import validate_google_refs
from kakao_refs import validate_kakao_refs
from member_course_validation import normalize_course, known_places, place_ids
from member_course_repository import public_course_cache, public_snapshot
router=APIRouter(prefix='/api/member')
KEYS={'coursepick.editorialCopies.v1','coursepick.travelJournals.v1','coursepick.travelTaste.v1','coursepick.testTaste.v1','course-favorites','coursepick.savedPlaces.v1','coursepick.myCourses.v1','coursepick.likedCourses.v1','coursepick.draft.v1','coursepick.profile.v1','coursepick.accommodations.v1'}
def config():
 c=dotenv_values(Path(__file__).with_name('.env'),interpolate=False)
 return (os.environ.get('SUPABASE_URL') or c['SUPABASE_URL'],os.environ.get('SUPABASE_SERVICE_KEY') or c['SUPABASE_SERVICE_KEY'])
def db():
 url,key=config();return create_client(url,key)
def auth_request(path,data=None,token=None):
 url,key=config();headers={'apikey':key,'Content-Type':'application/json'}
 if token:headers['Authorization']='Bearer '+token
 try:
  req=Request(url+'/auth/v1/'+path,data=json.dumps(data).encode() if data is not None else None,headers=headers,method='POST' if data is not None else 'GET')
  with urlopen(req,timeout=15) as response:
   raw=response.read();return json.loads(raw) if raw else {}
 except HTTPError as e:
  if e.code==429:raise HTTPException(429,'잠시 후 다시 시도해 주세요.') from None
  raise HTTPException(400,'이메일 또는 비밀번호를 확인해 주세요.') from None
 except Exception:raise HTTPException(502,'인증 서버에 연결하지 못했습니다.') from None
def member(authorization):
 if not authorization or not authorization.startswith('Bearer '):raise HTTPException(401,'로그인이 필요합니다.')
 try:
  user=db().auth.get_user(authorization[7:]).user
  if not user:raise ValueError()
  return user
 except Exception:raise HTTPException(401,'로그인이 만료되었습니다. 다시 로그인해 주세요.') from None
class Credentials(BaseModel):
 email:str=Field(min_length=3,max_length=254)
 password:str=Field(min_length=6,max_length=128)
 nickname:str=Field(default='',max_length=20)
@router.post('/signup')
def signup(body:Credentials):
 if not body.nickname.strip():raise HTTPException(400,'닉네임을 입력해 주세요.')
 email=body.email.strip().lower()
 if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+',email):raise HTTPException(400,'이메일 주소를 확인해 주세요.')
 try:
  db().auth.admin.create_user({'email':email,'password':body.password,'email_confirm':True,'user_metadata':{'nickname':body.nickname.strip(),'travel_taste_onboarding':1}})
 except Exception as error:
  code=getattr(error,'code','')
  message=str(error).lower()
  if code in ('email_exists','user_already_exists') or 'already been registered' in message or 'already registered' in message or 'already exists' in message:
   raise HTTPException(409,'이미 가입된 이메일 주소입니다. 로그인하거나 다른 이메일을 사용해 주세요.') from None
  if 'password' in message:raise HTTPException(400,'비밀번호는 6자 이상으로 작성해 주세요.') from None
  raise HTTPException(502,'회원가입을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요.') from None
 return {'message':'회원가입이 완료됐어요. 로그인해 주세요.'}
@router.post('/login')
def login(body:Credentials):
 return auth_request('token?grant_type=password',{'email':body.email.strip().lower(),'password':body.password})
class Refresh(BaseModel):
 refresh_token:str
@router.post('/refresh')
def refresh(body:Refresh):return auth_request('token?grant_type=refresh_token',{'refresh_token':body.refresh_token})
@router.post('/logout')
def logout(authorization:str|None=Header(None)):
 member(authorization);auth_request('logout',{},authorization[7:]);return {'ok':True}
@router.get('/data')
def load(authorization:str|None=Header(None)):
 user=member(authorization)
 try:rows=db().table('member_data').select('data_key,value').eq('user_id',str(user.id)).execute().data
 except Exception:raise HTTPException(503,'회원 저장 테이블 설정이 필요합니다. 관리자에게 문의해 주세요.') from None
 values={r['data_key']:r['value'] for r in rows}
 profile=values.get('coursepick.profile.v1')
 if isinstance(profile,dict) and profile.get('photoPath') and profile['photoPath'].startswith(str(user.id)+'/'):
     try:profile['photo']=db().storage.from_('member-avatars').create_signed_url(profile['photoPath'],3600)['signedURL']
     except Exception:profile.pop('photo',None)
 return {'userId':str(user.id),'values':values,'nickname':(user.user_metadata or {}).get('nickname','여행자'),'tasteOnboardingRequired':(user.user_metadata or {}).get('travel_taste_onboarding')==1}
class Value(BaseModel):
 key:str
 value:object
@router.put('/data')
def save(body: Value, authorization: str | None = Header(None)):
    user = member(authorization)

    if body.key not in KEYS:
        raise HTTPException(
            status_code=400,
            detail='저장 항목을 확인해 주세요.'
        )

    if len(json.dumps(body.value)) > 500000:
        raise HTTPException(
            status_code=413,
            detail='저장할 데이터가 너무 큽니다.'
        )

    if body.key == 'coursepick.editorialCopies.v1':
        try: body.value = validate_editorial_copies(body.value)
        except ValueError: raise HTTPException(422, '기획코스의 제목·방문 일차·장소 정보를 확인해 주세요.') from None

    if body.key == 'coursepick.travelJournals.v1':
        try: body.value = validate_journals(body.value)
        except ValueError: raise HTTPException(422, '여행기의 제목·방문일·장소·내용을 확인해 주세요.') from None
    if body.key == 'coursepick.travelTaste.v1':
        try: body.value = validate_travel_taste(body.value)
        except ValueError: raise HTTPException(422, '성향은 각 축에 0~100 정수로 입력해 주세요.') from None

    if body.key == 'coursepick.draft.v1' and isinstance(body.value,dict) and 'kakaoPlaceRefs' in body.value:
        try:body.value['kakaoPlaceRefs']=validate_kakao_refs(body.value['kakaoPlaceRefs'])
        except ValueError:raise HTTPException(422,'Kakao 장소의 ID와 검색 조건을 확인해 주세요.') from None

    if body.key == 'coursepick.draft.v1' and isinstance(body.value,dict) and 'googlePlaceRefs' in body.value:
        try:body.value['googlePlaceRefs']=validate_google_refs(body.value['googlePlaceRefs'])
        except ValueError:raise HTTPException(422,'Google 장소의 ID와 방문 일차를 확인해 주세요.') from None

    if body.key == 'coursepick.myCourses.v1':
        if not isinstance(body.value, list) or len(body.value) > 500:
            raise HTTPException(422, '코스 목록 형식을 확인해 주세요.')
        try:
            courses = [normalize_course(c) for c in body.value]
            if len({c['id'] for c in courses}) != len(courses):
                raise ValueError('중복 코스 ID')
        except ValueError:
            raise HTTPException(422, '코스의 장소·태그·일정·이동수단·시간을 확인해 주세요.') from None
        for course in courses:
            validate_course_title(course['name'])
        try:
            ids = place_ids(courses)
            existing = known_places(db(), ids)
        except Exception:
            raise HTTPException(503, '장소 정보를 확인하지 못했습니다. 다시 시도해 주세요.') from None
        if not set(ids).issubset(existing):
            # Preserve unchanged legacy records without allowing new invalid references
            # or publishing/editing an unresolved record.
            try:
                rows = db().table('member_data').select('value').eq('user_id', str(user.id)).eq('data_key', body.key).limit(1).execute().data
                previous = rows[0].get('value', []) if rows else []
                saved = {}
                if isinstance(previous, list):
                    for value in previous:
                        try:
                            old = normalize_course(value)
                            saved[old['id']] = old
                        except ValueError:
                            continue
                def comparable(value):
                    return {k:v for k,v in value.items() if k not in ('author','authorId')}
                for course in courses:
                    if not set(place_ids([course])).issubset(existing):
                        old = saved.get(course['id'])
                        if old is None or comparable(old) != comparable(course):
                            raise HTTPException(422, '등록되지 않은 장소가 포함되어 있습니다. 해당 코스의 장소를 다시 선택해 주세요.')
            except HTTPException:
                raise
            except Exception:
                raise HTTPException(503, '기존 코스를 확인하지 못했습니다. 다시 시도해 주세요.') from None
        nickname = (user.user_metadata or {}).get('nickname')
        author = nickname.strip()[:20] if isinstance(nickname, str) and nickname.strip() else '여행자'
        for course in courses:
            course['author'], course['authorId'] = author, str(user.id)
        body.value = courses

    # Store save dates atomically with the course list, for future annual reports.
    try:
        client=db()
        record={'user_id':str(user.id),'data_key':body.key,'value':body.value}
        records=[record]
        if body.key in TRACKED_KEYS:
            rows=client.table('member_data').select('data_key,value').eq('user_id',str(user.id)).in_('data_key',[body.key,DATE_KEY]).execute().data
            stored={row['data_key']:row['value'] for row in rows}
            previous=report_course_ids(body.key,stored.get(body.key,[]))
            current=report_course_ids(body.key,body.value)
            dates=next_dates(previous,current,stored.get(DATE_KEY,{}),datetime.now(timezone.utc).isoformat())
            records.append({'user_id':str(user.id),'data_key':DATE_KEY,'value':dates})
        client.table('member_data').upsert(records if len(records)>1 else record,on_conflict='user_id,data_key').execute()

    except Exception:
        raise HTTPException(
            status_code=503,
            detail='회원 정보를 저장하지 못했습니다. 다시 시도해 주세요.'
        ) from None

    if body.key == 'coursepick.travelJournals.v1':
        try: body.value = validate_journals(body.value)
        except ValueError: raise HTTPException(422, '여행기의 제목·방문일·장소·내용을 확인해 주세요.') from None
    if body.key == 'coursepick.travelTaste.v1':
        try: body.value = validate_travel_taste(body.value)
        except ValueError: raise HTTPException(422, '성향은 각 축에 0~100 정수로 입력해 주세요.') from None

    if body.key == 'coursepick.myCourses.v1':
        public_course_cache.clear()
    return {'ok': True}
class Photo(BaseModel):
 data:str=Field(max_length=3000000)
@router.post('/photo')
def photo(body:Photo,authorization:str|None=Header(None)):
 import base64,uuid
 user=member(authorization)
 try:
  header,encoded=body.data.split(',',1);mime=header.split(':')[1].split(';')[0]
  if mime not in ('image/png','image/jpeg','image/webp'):raise ValueError()
  raw=base64.b64decode(encoded,validate=True)
  if len(raw)>2*1024*1024:raise ValueError()
  if not (raw.startswith(b'\x89PNG\r\n\x1a\n') or raw.startswith(b'\xff\xd8\xff') or raw[:4]==b'RIFF' and raw[8:12]==b'WEBP'):raise ValueError()
 except Exception:raise HTTPException(400,'PNG·JPG·WebP 사진을 2MB 이하로 선택해 주세요.') from None
 client=db();bucket='member-avatars';path=str(user.id)+'/'+str(uuid.uuid4())+'.'+{'image/png':'png','image/jpeg':'jpg','image/webp':'webp'}[mime]
 try:
  client.storage.from_(bucket).upload(path,raw,{'content-type':mime})
  return {'path':path,'url':client.storage.from_(bucket).create_signed_url(path,3600)['signedURL']}
 except Exception:raise HTTPException(503,'프로필 사진 저장소 설정을 확인해 주세요.') from None

@router.get('/public-courses')
def public_courses(offset: int = 0, limit: int = 100):
 if offset < 0 or not 1 <= limit <= 100:
  raise HTTPException(422, '공개 코스 페이지 범위를 확인해 주세요.')
 try:
  courses = public_course_cache.read('public', lambda: public_snapshot(db()))
 except Exception:
  raise HTTPException(503, '공개 코스를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.') from None
 end = offset + limit
 return {'courses': courses[offset:end], 'more': end < len(courses), 'nextOffset': end if end < len(courses) else None}

class RecoveryEmail(BaseModel):
 email:str=Field(min_length=3,max_length=254)
@router.post('/recover')
def recover_password(body:RecoveryEmail):
 email=body.email.strip().lower()
 if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+',email):raise HTTPException(400,'이메일 주소를 확인해 주세요.')
 try:
  # Uses the recovery redirect configured in Supabase; no user-provided redirect URL.
  db().auth.reset_password_for_email(email)
 except Exception:raise HTTPException(503,'재설정 메일을 요청하지 못했습니다. 잠시 후 다시 시도해주세요.') from None
 return {'message':'가입된 이메일이라면 재설정 안내가 발송됩니다. 메일함과 스팸함을 확인해주세요.'}
class ResetPassword(BaseModel):
 password:str=Field(min_length=6,max_length=128)
@router.post('/reset-password')
def reset_password(body:ResetPassword,authorization:str|None=Header(None)):
 member(authorization)
 url,key=config()
 try:
  req=Request(url+'/auth/v1/user',data=json.dumps({'password':body.password}).encode(),headers={'apikey':key,'Content-Type':'application/json','Authorization':authorization},method='PUT')
  with urlopen(req,timeout=15) as response:response.read()
 except Exception:raise HTTPException(400,'비밀번호를 변경하지 못했습니다. 재설정 메일을 다시 요청해주세요.') from None
 return {'ok':True}
