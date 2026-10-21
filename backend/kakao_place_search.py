"""Request-scoped Kakao results: no database, disk, response cache or logging."""
import json
import math
import os
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from dotenv import dotenv_values
from fastapi import APIRouter, HTTPException, Request as IncomingRequest
from kakao_rate_limit import admit_request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import Literal
from kakao_refs import validate_kakao_refs

router = APIRouter()
NO_STORE = {'Cache-Control': 'no-store, private', 'Pragma': 'no-cache'}

class PlaceSearch(BaseModel):
    query: str = Field(min_length=1, max_length=80)
    region: str = Field(default='', max_length=30)
    category: Literal['전체','맛집','카페','관광','체험','숙소'] = '전체'
    page: int = Field(default=1, ge=1, le=45)
    latitude: float | None = None
    longitude: float | None = None

def search_parameters(body):
    query = body.query.strip()
    if not query:
        raise HTTPException(422, '검색어를 입력해 주세요.', headers=NO_STORE)
    region = body.region.strip()
    if region and region not in ('전체', '여러 지역') and region not in query:
        query = f'{region} {query}'
    params = {'query': query, 'page': body.page, 'size': 15, 'sort': 'accuracy'}
    code={'맛집':'FD6','카페':'CE7','관광':'AT4','숙소':'AD5'}.get(body.category)
    if code:params['category_group_code']=code
    if body.latitude is not None or body.longitude is not None:
        if not all(isinstance(v, (float, int)) and math.isfinite(v) for v in (body.latitude, body.longitude)) or not (-90 <= body.latitude <= 90 and -180 <= body.longitude <= 180):
            raise HTTPException(422, '검색 기준 위치를 확인해 주세요.', headers=NO_STORE)
        params.update(x=body.longitude, y=body.latitude, radius=20000)
    else:
        params['rect'] = '124,33,132,39'
    return params

def normalize_document(row):
    try:
        latitude, longitude = float(row['y']), float(row['x'])
    except (KeyError, ValueError, TypeError):
        return None
    place_id = str(row.get('id', ''))
    if not place_id.isdecimal() or not math.isfinite(latitude) or not math.isfinite(longitude) or not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
        return None
    def value(key):
        text = row.get(key, '')
        return text[:500] if isinstance(text, str) else ''
    category_path=value('category_name')
    code=value('category_group_code')
    category={'FD6':'음식점','CE7':'카페','AT4':'관광지','AD5':'숙소'}.get(code,'여행 장소')
    tags=[]
    for word,tag in [('한식','한식'),('일식','일식'),('중식','중식'),('양식','양식'),('커피','커피'),('카페','커피'),('제과','빵'),('공방','공방'),('체험','체험'),('박물관','역사문화'),('미술관','예술'),('공원','산책'),('맥주','맥주')]:
        if word in category_path and tag not in tags:tags.append(tag)
    if category=='음식점':tags.insert(0,'미식')
    if category=='숙소':tags.insert(0,'숙박')
    address=value('road_address_name') or value('address_name')
    region=address.split()[0] if address else ''
    for full,short in [('서울특별시','서울'),('부산광역시','부산'),('울산광역시','울산'),('광주광역시','광주'),('대구광역시','대구'),('대전광역시','대전'),('인천광역시','인천')]:
        if region==full:region=short
    return dict(id=place_id, name=value('place_name'), category=category, categoryPath=category_path, tags=tags[:3],region=region,countryCode='KR',
                address=value('address_name'), roadAddress=value('road_address_name'),
                phone=value('phone'), latitude=latitude, longitude=longitude,
                url=f'https://place.map.kakao.com/{place_id}')

def lookup_places(body: PlaceSearch):
    params = search_parameters(body)
    config = dotenv_values(Path(__file__).with_name('.env'), interpolate=False)
    key = (os.environ.get('KAKAO_REST_API_KEY') or config.get('KAKAO_REST_API_KEY') or
           os.environ.get('KAKAO_MOBILITY_REST_API_KEY') or config.get('KAKAO_MOBILITY_REST_API_KEY') or '').strip()
    if not key:
        raise HTTPException(503, '백엔드에 카카오 REST API 키 설정이 필요합니다.', headers=NO_STORE)
    request = Request('https://dapi.kakao.com/v2/local/search/keyword.json?' + urlencode(params),
                      headers={'Authorization': 'KakaoAK ' + key})
    try:
        with urlopen(request, timeout=12) as response:
            raw = response.read(2_000_001)
        if len(raw) > 2_000_000:
            raise ValueError('response limit')
        payload = json.loads(raw)
        documents = payload['documents']
        if not isinstance(documents, list):
            raise ValueError('documents')
        places = [place for row in documents if isinstance(row, dict) and (place := normalize_document(row))]
        result = {'places': places, 'page': body.page,
                  'hasMore': not payload.get('meta', {}).get('is_end', True) and body.page < 45}
    except HTTPError as error:
        message = '카카오 검색 사용량 한도에 도달했습니다.' if error.code == 429 else '카카오 검색 연결을 확인해 주세요.'
        raise HTTPException(429 if error.code == 429 else 502, message, headers=NO_STORE) from None
    except (URLError, TimeoutError, OSError, ValueError, KeyError, TypeError):
        raise HTTPException(502, '장소 검색에 실패했습니다. 잠시 후 다시 시도해 주세요.', headers=NO_STORE) from None
    return result

@router.post('/api/kakao/places/search')
def search_places(body: PlaceSearch,request: IncomingRequest=None):
    admit_request(request)
    return JSONResponse(lookup_places(body), headers=NO_STORE)

class PlaceReferences(BaseModel):
    refs: list = Field(max_length=20)

@router.post('/api/kakao/places/references')
def resolve_references(body: PlaceReferences,request: IncomingRequest=None):
    try:refs=validate_kakao_refs(body.refs)
    except ValueError:raise HTTPException(422,'장소 ID와 검색 조건을 확인해 주세요.',headers=NO_STORE) from None
    # Per-request deduplication only; search results are never persisted.
    groups={}
    for ref in refs:groups.setdefault((ref['query'],ref['category'],ref['page']),[]).append(ref)
    admit_request(request,len(groups))
    found={};errors=[]
    for (query,category,page), group in groups.items():
        try:
            result=lookup_places(PlaceSearch(query=query,category=category,page=page))
            rows={p['id']:p for p in result['places']}
            for ref in group:
                if ref['placeId'] in rows:
                    found[ref['placeId']]={**rows[ref['placeId']],'lookup':dict(query=query,category=category,page=page)}
                else:errors.append(ref['placeId'])
        except HTTPException:
            errors.extend(ref['placeId'] for ref in group)
    return JSONResponse(dict(places=list(found.values()),errors=errors),headers=NO_STORE)
