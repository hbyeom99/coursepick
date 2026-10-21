from google_keyword_rules import google_keywords
"""On-demand Google display only: no content persistence or recommendation input."""
import hashlib,hmac,json,os,re,time
from collections import deque
from pathlib import Path
from typing import Literal
from threading import Lock
from urllib.request import Request,urlopen
from urllib.error import HTTPError,URLError
from urllib.parse import quote
from dotenv import dotenv_values
from fastapi import APIRouter,HTTPException,Response
from pydantic import BaseModel,Field
from place_queries import place_client

router=APIRouter(prefix='/api/google')
NO_STORE={'Cache-Control':'private, no-store, max-age=0','Pragma':'no-cache'}
_calls=deque();_lock=Lock()
def api_key():
    cfg=dotenv_values(Path(__file__).with_name('.env'),interpolate=False)
    key=(os.environ.get('GOOGLE_PLACES_API_KEY') or cfg.get('GOOGLE_PLACES_API_KEY') or '').strip()
    if not key:raise HTTPException(503,'Google 보조 조회를 준비 중입니다.',headers=NO_STORE)
    return key
def throttle():
    with _lock:
        now=time.monotonic()
        while _calls and _calls[0]<now-60:_calls.popleft()
        if len(_calls)>=30:raise HTTPException(429,'조회가 많습니다. 잠시 후 다시 시도해 주세요.',headers=NO_STORE)
        _calls.append(now)
def google_request(path,fields,key,data=None):
    throttle()
    request=Request('https://places.googleapis.com/v1/'+path,
        data=json.dumps(data).encode() if data is not None else None,
        headers={'Content-Type':'application/json','X-Goog-Api-Key':key,'X-Goog-FieldMask':fields})
    try:
        with urlopen(request,timeout=12) as result:return json.load(result)
    except HTTPError as error:
        status=429 if error.code==429 else 502
        raise HTTPException(status,'Google 정보를 조회하지 못했습니다. API 설정과 사용량을 확인해 주세요.',headers=NO_STORE) from None
    except (URLError,TimeoutError,ValueError,OSError):
        raise HTTPException(502,'Google에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.',headers=NO_STORE) from None
def ticket(place_id,key,expires=None):
    expires=expires or int(time.time())+600
    payload=f'{place_id}.{expires}'
    return payload+'.'+hmac.new(key.encode(),payload.encode(),hashlib.sha256).hexdigest()
def verify_ticket(value,key):
    try:
        place_id,expiry,signature=value.rsplit('.',2)
        if not re.fullmatch(r'[A-Za-z0-9_-]{1,255}',place_id):raise ValueError()
        if not int(time.time())<=int(expiry)<=int(time.time())+610:raise ValueError()
        if not hmac.compare_digest(ticket(place_id,key,int(expiry)),value):raise ValueError()
        return place_id
    except (ValueError,TypeError):raise HTTPException(400,'조회 시간이 지났습니다. 장소를 다시 검색해 주세요.',headers=NO_STORE) from None
def safe_url(value):
    from urllib.parse import urlparse
    try:
        parsed=urlparse(value or '')
        return value if parsed.scheme=='https' and parsed.hostname and not parsed.username and not parsed.password else ''
    except ValueError:return ''
def display(row):
    return {'id':row.get('id',''),'name':(row.get('displayName') or {}).get('text',''),
        'address':row.get('formattedAddress',''),
        'attributions':[{'name':a.get('provider',''),'url':safe_url(a.get('providerUri'))} for a in row.get('attributions',[]) if a.get('provider')]}
@router.get('/places/{internal_id}')
def search(internal_id:str,response:Response):
    response.headers.update(NO_STORE);key=api_key()
    if len(internal_id)>255:raise HTTPException(400,'장소를 확인해 주세요.',headers=NO_STORE)
    try:rows=place_client().table('places').select('id,name,location,region').eq('id',internal_id).limit(1).execute().data
    except Exception:raise HTTPException(503,'기본 장소 정보를 불러오지 못했습니다.',headers=NO_STORE) from None
    if not rows:raise HTTPException(404,'기본 DB에 등록된 장소만 보조 조회할 수 있습니다.',headers=NO_STORE)
    row=rows[0];query=' '.join(str(row.get(k) or '') for k in ['name','location','region'])[:500]
    result=google_request('places:searchText','places.id,places.displayName,places.formattedAddress,places.attributions',key,{'textQuery':query,'languageCode':'ko','regionCode':'KR','pageSize':3})
    return {'places':[{**display(p),'ticket':ticket(p['id'],key)} for p in result.get('places',[]) if re.fullmatch(r'[A-Za-z0-9_-]{1,255}',p.get('id',''))]}
class DetailsInput(BaseModel):
    ticket:str=Field(min_length=1,max_length=500)
@router.post('/details')
def details(body:DetailsInput,response:Response):
    response.headers.update(NO_STORE);key=api_key();place_id=verify_ticket(body.ticket,key)
    row=google_request('places/'+quote(place_id,safe='')+'?languageCode=ko','id,displayName,formattedAddress,nationalPhoneNumber,regularOpeningHours.weekdayDescriptions,googleMapsUri,attributions',key)
    return {**display(row),'phone':row.get('nationalPhoneNumber',''),
        'hours':(row.get('regularOpeningHours') or {}).get('weekdayDescriptions',[]),'url':safe_url(row.get('googleMapsUri'))}

class SearchInput(BaseModel):
    query:str=Field(min_length=2,max_length=200)
    category:Literal['전체','맛집','카페','관광','체험','숙소']='전체'
    anchor:dict[str,str]|None=None
    pageToken:str|None=Field(default=None,max_length=4096)

@router.post('/search')
def search_text(body:SearchInput,response:Response):
    response.headers.update(NO_STORE)
    query=body.query.strip()
    if len(query)<2:raise HTTPException(400,'검색어를 두 글자 이상 입력해 주세요.',headers=NO_STORE)
    payload={'textQuery':query,'languageCode':'ko','regionCode':'KR','pageSize':10}
    place_type={'맛집':'restaurant','카페':'cafe','관광':'tourist_attraction','숙소':'lodging'}.get(body.category)
    if place_type:payload.update(includedType=place_type,strictTypeFiltering=True)
    key=api_key()
    if body.pageToken:payload['pageToken']=body.pageToken
    result=google_request('places:searchText',','.join('places.'+field for field in PICKER_FIELDS.split(','))+',nextPageToken',key,payload)
    anchor=None;anchor_error=None
    if body.anchor:
        try:anchor,_=resolve_endpoint(PlaceEndpoint.model_validate(body.anchor),key)
        except Exception:anchor_error='기준 장소 조회 실패'
    return {'places':[rich_place(p,key) for p in result.get('places',[]) if re.fullmatch(r'[A-Za-z0-9_-]{1,255}',p.get('id',''))],'anchor':anchor,'anchorError':anchor_error,'nextPageToken':result.get('nextPageToken')}

class ReferenceInput(BaseModel):
    placeIds:list[str]=Field(min_length=1,max_length=20)

@router.post('/references')
def references(body:ReferenceInput,response:Response):
    response.headers.update(NO_STORE)
    if len(set(body.placeIds))!=len(body.placeIds) or any(not re.fullmatch(r'[A-Za-z0-9_-]{1,255}',pid) for pid in body.placeIds):raise HTTPException(400,'장소 ID를 확인해 주세요.',headers=NO_STORE)
    key=api_key();places=[];errors=[]
    for pid in body.placeIds:
        try:
            row=google_request('places/'+quote(pid,safe='')+'?languageCode=ko',PICKER_FIELDS,key)
            places.append(rich_place(row,key))
        except HTTPException as error:
            if error.status_code==429:raise
            errors.append(pid)
    return {'places':places,'errors':errors}

# On-demand display helpers: never persist Google content or coordinates.
import base64
import math
from fastapi.responses import RedirectResponse

PICKER_FIELDS='id,displayName,formattedAddress,location,primaryTypeDisplayName,types,addressComponents,photos,attributions'
TYPE_LABELS={'cafe':'카페','coffee_shop':'커피','bakery':'베이커리','restaurant':'음식점','tourist_attraction':'관광지','park':'공원','museum':'박물관','art_gallery':'전시','lodging':'숙소','amusement_park':'놀이공원','aquarium':'아쿠아리움','zoo':'동물원','hiking_area':'산책로','spa':'스파','shopping_mall':'쇼핑'}
PHOTO_NAME=re.compile(r'places/[A-Za-z0-9_-]{1,255}/photos/[A-Za-z0-9_-]{1,2000}')

def photo_ticket(name,key):
    payload=base64.urlsafe_b64encode(name.encode()).decode().rstrip('=')+'.'+str(int(time.time())+900)
    return payload+'.'+hmac.new(key.encode(),payload.encode(),hashlib.sha256).hexdigest()

def photo_name(value,key):
    try:
        encoded,expiry,signature=value.rsplit('.',2)
        payload=encoded+'.'+expiry
        if not int(time.time())<=int(expiry)<=int(time.time())+910 or not hmac.compare_digest(hmac.new(key.encode(),payload.encode(),hashlib.sha256).hexdigest(),signature):raise ValueError()
        name=base64.urlsafe_b64decode(encoded+'='*((-len(encoded))%4)).decode()
        if not PHOTO_NAME.fullmatch(name):raise ValueError()
        return name
    except Exception:raise HTTPException(400,'사진 조회 시간이 지났습니다. 다시 검색해 주세요.',headers=NO_STORE) from None

def rich_place(row,key):
    value=display(row)
    point=row.get('location') or {}
    lat,lng=point.get('latitude'),point.get('longitude')
    if type(lat) in (int,float) and type(lng) in (int,float) and math.isfinite(lat) and math.isfinite(lng) and -90<=lat<=90 and -180<=lng<=180:value.update(latitude=lat,longitude=lng)
    types=row.get('types') or []
    tags=list(dict.fromkeys(TYPE_LABELS[t] for t in types if t in TYPE_LABELS))[:3]
    category=(row.get('primaryTypeDisplayName') or {}).get('text') or (tags[0] if tags else '장소')
    if any(t in types for t in ('cafe','coffee_shop','bakery','tea_house')):category='카페'
    elif 'restaurant' in types:category='음식점'
    elif 'lodging' in types:category='숙소'
    elif any(t in types for t in ('tourist_attraction','park','museum','art_gallery')):category='관광지'
    components=row.get('addressComponents') or []
    region=next((p.get('shortText') or p.get('longText','') for p in components if 'administrative_area_level_1' in p.get('types',[])), '')
    region={'서울특별시':'서울','부산광역시':'부산','대구광역시':'대구','인천광역시':'인천','광주광역시':'광주','대전광역시':'대전','울산광역시':'울산','세종특별자치시':'세종','경기도':'경기','강원특별자치도':'강원','충청북도':'충북','충청남도':'충남','전북특별자치도':'전북','전라남도':'전남','경상북도':'경북','경상남도':'경남','제주특별자치도':'제주'}.get(region,region)
    country=next((p.get('shortText','') for p in components if 'country' in p.get('types',[])), '')
    keywords,evidence=google_keywords(row)
    value.update(category=category,tags=keywords,keywordEvidence=evidence,region=region,countryCode=country)
    photo=next((p for p in row.get('photos',[]) if PHOTO_NAME.fullmatch(p.get('name',''))),None)
    if photo:
        value['photoToken']=photo_ticket(photo['name'],key)
        value['photoSourceUrl']=safe_url(photo.get('googleMapsUri'))
        value['photoAuthors']=[{'name':p.get('displayName',''),'url':safe_url(p.get('uri'))} for p in photo.get('authorAttributions',[]) if p.get('displayName')]
    return value

class PlaceEndpoint(BaseModel):
    model_config={'extra':'forbid'}
    googlePlaceId:str|None=Field(default=None,min_length=1,max_length=255)
    internalId:str|None=Field(default=None,min_length=1,max_length=255)

def resolve_endpoint(endpoint,key):
    if bool(endpoint.googlePlaceId)==bool(endpoint.internalId):raise HTTPException(400,'장소를 하나 선택해 주세요.',headers=NO_STORE)
    if endpoint.googlePlaceId:
        if not re.fullmatch(r'[A-Za-z0-9_-]{1,255}',endpoint.googlePlaceId):raise HTTPException(400,'장소 ID를 확인해 주세요.',headers=NO_STORE)
        row=google_request('places/'+quote(endpoint.googlePlaceId,safe='')+'?languageCode=ko',PICKER_FIELDS,key)
        return rich_place(row,key),{'placeId':endpoint.googlePlaceId}
    try:rows=place_client().table('places').select('id,name,latitude,longitude,region').eq('id',endpoint.internalId).limit(1).execute().data
    except Exception:raise HTTPException(503,'기준 장소를 불러오지 못했습니다.',headers=NO_STORE) from None
    if not rows:raise HTTPException(404,'기준 장소를 찾지 못했습니다.',headers=NO_STORE)
    place={**rows[0],'countryCode':'KR'}
    lat,lng=place.get('latitude'),place.get('longitude')
    if type(lat) not in (int,float) or type(lng) not in (int,float) or not math.isfinite(lat) or not math.isfinite(lng) or not -90<=lat<=90 or not -180<=lng<=180:raise HTTPException(422,'기준 장소의 좌표를 확인할 수 없습니다.',headers=NO_STORE)
    return place,{'location':{'latLng':{'latitude':lat,'longitude':lng}}}

@router.get('/photo')
def photo(token:str,size:int=192):
    if size not in (192,640):raise HTTPException(400,'사진 크기를 확인해 주세요.',headers=NO_STORE)
    if len(token)>4000:raise HTTPException(400,'사진 요청을 확인해 주세요.',headers=NO_STORE)
    key=api_key();name=photo_name(token,key);throttle()
    request=Request('https://places.googleapis.com/v1/'+name+f'/media?maxWidthPx={size}&maxHeightPx={size}&skipHttpRedirect=true',headers={'X-Goog-Api-Key':key})
    try:
        with urlopen(request,timeout=12) as result:value=json.load(result)
        url=safe_url(value.get('photoUri'))
        from urllib.parse import urlparse
        host=urlparse(url).hostname or ''
        if not any(host==domain or host.endswith('.'+domain) for domain in ['googleusercontent.com','ggpht.com','google.com']):raise ValueError()
        return RedirectResponse(url,status_code=302,headers=NO_STORE)
    except Exception:raise HTTPException(502,'사진을 불러오지 못했습니다.',headers=NO_STORE) from None

class RouteInput(BaseModel):
    origin:PlaceEndpoint
    destination:PlaceEndpoint
    travelMode:Literal['DRIVE','WALK','TRANSIT']='TRANSIT'

def route_request(payload,key):
    throttle()
    request=Request('https://routes.googleapis.com/directions/v2:computeRoutes',data=json.dumps(payload).encode(),headers={'Content-Type':'application/json','X-Goog-Api-Key':key,'X-Goog-FieldMask':'routes.distanceMeters,routes.duration'})
    try:
        with urlopen(request,timeout=15) as result:return json.load(result)
    except HTTPError as error:
        if error.code==403:raise HTTPException(403,'Google Cloud에서 Routes API 활성화와 서버 키의 API 제한 설정을 확인해 주세요.',headers=NO_STORE) from None
        if error.code==429:raise HTTPException(429,'이동정보 조회 한도에 도달했습니다. 잠시 후 다시 시도해 주세요.',headers=NO_STORE) from None
        raise HTTPException(502,'이 구간의 이동정보를 조회하지 못했습니다.',headers=NO_STORE) from None
    except (URLError,TimeoutError,ValueError,OSError):raise HTTPException(502,'이동정보에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.',headers=NO_STORE) from None

@router.post('/route')
def route(body:RouteInput,response:Response):
    response.headers.update(NO_STORE);places_key=api_key()
    start,origin=resolve_endpoint(body.origin,places_key)
    end,destination=resolve_endpoint(body.destination,places_key)
    if body.travelMode in ('DRIVE','WALK') and 'KR' in (start.get('countryCode'),end.get('countryCode')):
        return {'status':'unsupported','message':'한국의 자동차·도보 경로는 Google API에서 현재 지원하지 않습니다. 직선거리를 확인해 주세요.'}
    cfg=dotenv_values(Path(__file__).with_name('.env'),interpolate=False)
    key=(os.environ.get('GOOGLE_ROUTES_API_KEY') or cfg.get('GOOGLE_ROUTES_API_KEY') or places_key).strip()
    result=route_request({'origin':origin,'destination':destination,'travelMode':body.travelMode,'languageCode':'ko','units':'METRIC'},key)
    routes=result.get('routes') or []
    if not routes:return {'status':'unavailable','message':'선택한 교통수단의 경로를 찾지 못했습니다. 직선거리만 표시합니다.'}
    first=routes[0];duration=first.get('duration','');distance=first.get('distanceMeters')
    if not re.fullmatch(r'\d+(?:\.\d+)?s',duration) or type(distance) not in (int,float) or not math.isfinite(distance) or distance<0:raise HTTPException(502,'이동정보 응답을 확인해 주세요.',headers=NO_STORE)
    return {'status':'ok','distanceMeters':distance,'durationSeconds':float(duration[:-1]),'travelMode':body.travelMode,'attribution':'Google Maps'}

class PlaceDetailsInput(BaseModel):
    placeId:str=Field(min_length=1,max_length=255)

@router.post('/place-details')
def place_details(body:PlaceDetailsInput,response:Response):
    response.headers.update(NO_STORE)
    if not re.fullmatch(r'[A-Za-z0-9_-]{1,255}',body.placeId):raise HTTPException(400,'장소 ID를 확인해 주세요.',headers=NO_STORE)
    key=api_key()
    fields=PICKER_FIELDS+',editorialSummary,regularOpeningHours.weekdayDescriptions,nationalPhoneNumber,googleMapsUri,websiteUri'
    row=google_request('places/'+quote(body.placeId,safe='')+'?languageCode=ko',fields,key)
    return {**rich_place(row,key),'description':(row.get('editorialSummary') or {}).get('text',''),'hours':(row.get('regularOpeningHours') or {}).get('weekdayDescriptions',[]),'phone':row.get('nationalPhoneNumber',''),'mapsUrl':safe_url(row.get('googleMapsUri')),'website':safe_url(row.get('websiteUri'))}
