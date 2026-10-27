"""Aggregate travel tastes and issue signed, read-only report snapshot links."""
from collections import Counter
from datetime import datetime, timezone
import base64, hashlib, hmac, json, secrets, time, zlib
from fastapi import APIRouter, Header, HTTPException, Response
from pydantic import BaseModel, Field, field_validator
from member_accounts import member, db, config
from report_saved_dates import DATE_KEY

router=APIRouter(prefix='/api/report')
AXES=('planning','experience','exploration','spending')

def taste_type(value):
    if not isinstance(value,dict) or any(type(value.get(axis)) not in (int,float) or not 0<=value[axis]<=100 for axis in AXES):return None
    return ''.join('1' if value[axis]>=50 else '0' for axis in AXES)

def distribution(client, own_taste):
    counts=Counter();offset=0
    while True:
        rows=client.table('member_data').select('value').eq('data_key','coursepick.travelTaste.v1').order('user_id').range(offset,offset+499).execute().data
        for row in rows:
            code=taste_type(row.get('value'))
            if code is not None:counts[code]+=1
        if len(rows)<500:break
        offset+=500
    own=taste_type(own_taste);total=sum(counts.values());same=counts.get(own,0)
    return {'percentage':round(same/total*100,1) if own is not None and total else None,'sameCount':same if own is not None else None,'totalCount':total,'rarityRank':1+sum(0<n<same for n in counts.values()) if own is not None and same else None}

def context(user):
    client=db();rows=client.table('member_data').select('value').eq('user_id',str(user.id)).eq('data_key','coursepick.travelTaste.v1').limit(1).execute().data
    date_rows=client.table('member_data').select('value').eq('user_id',str(user.id)).eq('data_key',DATE_KEY).limit(1).execute().data
    saved_dates=date_rows[0].get('value',{}) if date_rows else {}
    created=str(getattr(user,'created_at','') or '')
    current=datetime.now(timezone.utc).astimezone(__import__('zoneinfo').ZoneInfo('Asia/Seoul')).year
    joined=int(created[:4]) if created[:4].isdigit() else current
    return {'joinedYear':joined,'currentYear':current,'savedDates':saved_dates if isinstance(saved_dates,dict) else {},**distribution(client,rows[0]['value'] if rows else None)}

@router.get('/context')
def report_context(authorization:str|None=Header(None)):
    user=member(authorization)
    try:return context(user)
    except HTTPException:raise
    except Exception:raise HTTPException(503,'여행 성향 통계를 불러오지 못했습니다.') from None

class Keyword(BaseModel):
    tag:str=Field(min_length=1,max_length=40)
    count:int=Field(ge=1,le=10000)
    image:str|None=Field(default=None,max_length=3000)
    @field_validator('image')
    @classmethod
    def safe_image(cls,value):
        if value and not (value.startswith(('https://','http://','/images/'))):raise ValueError('올바르지 않은 이미지 주소')
        return value
class Companion(BaseModel):
    name:str=Field(min_length=1,max_length=80)
    photo:str|None=Field(default=None,max_length=3000)
    count:int=Field(ge=1,le=10000)
    @field_validator('photo')
    @classmethod
    def safe_photo(cls,value):return Keyword.safe_image(value)
class Snapshot(BaseModel):
    year:int=Field(ge=1900,le=2200)
    topTags:list[Keyword]=Field(default_factory=list,max_length=3)
    companion:Companion|None=None
    undatedSaved:int=Field(default=0,ge=0,le=10000)
    courseCount:int=Field(default=0,ge=0,le=10000)

def secret():return hashlib.sha256(('coursepick-report-v1:'+config()[1]).encode()).digest()
def encode(value):return base64.urlsafe_b64encode(value).decode().rstrip('=')
def decode(value):return base64.urlsafe_b64decode(value+'='*(-len(value)%4))
def issue_snapshot(data,key,now=None):
    now=int(time.time()) if now is None else now
    raw=zlib.compress(json.dumps({'v':1,'exp':now+30*86400,'nonce':secrets.token_hex(8),'report':data},ensure_ascii=False,separators=(',',':')).encode())
    body=encode(raw);return body+'.'+encode(hmac.new(key,body.encode(),hashlib.sha256).digest())
def read_snapshot(token,key,now=None):
    if len(token)>18000:raise ValueError('token size')
    body,signature=token.split('.')
    if not hmac.compare_digest(hmac.new(key,body.encode(),hashlib.sha256).digest(),decode(signature)):raise ValueError('signature')
    unpack=zlib.decompressobj();raw=unpack.decompress(decode(body),20000)
    if unpack.unconsumed_tail or not unpack.eof:raise ValueError('payload size')
    data=json.loads(raw)
    if data.get('v')!=1 or data['exp']<(int(time.time()) if now is None else now):raise ValueError('expiry')
    return data['report']

@router.post('/share')
def share_report(body:Snapshot,authorization:str|None=Header(None)):
    user=member(authorization)
    try:
        stats=context(user)
        if not stats['joinedYear']<=body.year<=stats['currentYear']:raise HTTPException(422,'가입 연도부터 현재 연도까지 선택해 주세요.')
        snapshot={**body.model_dump(),**{k:stats[k] for k in ('percentage','sameCount','totalCount','rarityRank')}}
        return {'token':issue_snapshot(snapshot,secret()),'expiresInDays':30}
    except HTTPException:raise
    except Exception:raise HTTPException(503,'공유 링크를 만들지 못했습니다.') from None

@router.get('/shared/{token}')
def shared_report(token:str,response:Response):
    response.headers['Cache-Control']='no-store'
    try:return read_snapshot(token,secret())
    except Exception:raise HTTPException(404,'공유 링크가 만료되었거나 올바르지 않습니다.') from None
