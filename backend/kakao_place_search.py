"""Request-scoped Kakao results: no database, disk, response cache or logging."""
import json
import math
import os
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

from dotenv import dotenv_values
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

router = APIRouter()
NO_STORE = {'Cache-Control': 'no-store, private', 'Pragma': 'no-cache'}

class PlaceSearch(BaseModel):
    query: str = Field(min_length=1, max_length=80)
    region: str = Field(default='', max_length=30)
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
    return dict(id=place_id, name=value('place_name'), category=value('category_name'),
                address=value('address_name'), roadAddress=value('road_address_name'),
                phone=value('phone'), latitude=latitude, longitude=longitude,
                url=f'https://place.map.kakao.com/{place_id}')

@router.post('/api/kakao/places/search')
def search_places(body: PlaceSearch):
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
    return JSONResponse(result, headers=NO_STORE)
