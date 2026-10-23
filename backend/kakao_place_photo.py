"""Read a public place page's preview photo. No page/photo persistence."""
from html.parser import HTMLParser
import re
import ipaddress
from urllib.parse import urlsplit, parse_qs
from urllib.request import Request, build_opener, HTTPRedirectHandler
from fastapi import APIRouter, Request as IncomingRequest
from fastapi.responses import JSONResponse
from kakao_rate_limit import admit_request
from place_photo_cache import PhotoCache

router = APIRouter()
NO_STORE = {'Cache-Control': 'no-store, private', 'Pragma': 'no-cache'}
photo_cache = PhotoCache()

class PreviewParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.image = None
    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if tag == 'meta' and values.get('property', '').lower() == 'og:image':
            self.image = values.get('content')

def photo_url(html):
    parser = PreviewParser()
    parser.feed(html)
    value = parser.image or ''
    if value.startswith('//'):
        value = 'https:' + value
    parsed = urlsplit(value)
    # The URL must come from this fixed Kakao page's og:image metadata.
    if parsed.scheme != 'https' or parsed.port or parsed.username or parsed.password:
        return None
    if parsed.hostname in ('img1.kakaocdn.net', 'img2.kakaocdn.net', 'img3.kakaocdn.net', 'img4.kakaocdn.net'):
        if not parsed.path.startswith('/cthumb/local/'):
            return None
        original = urlsplit(parse_qs(parsed.query).get('fname', [''])[0])
    else:
        original = parsed
    if original.scheme not in ('http', 'https') or original.port or original.username or original.password:
        return None
    host = original.hostname or ''
    if not host or '.' not in host or host.endswith(('.localhost', '.local', '.internal')) or host == 'localhost':
        return None
    try:
        if not ipaddress.ip_address(host).is_global:
            return None
    except ValueError:
        pass
    # Accept public photo sources selected by the Kakao page, regardless of
    # the original hosting provider. Never fetch those hosts on the server.
    if 'staticmap' in host:
        return None
    return value

class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

def lookup_photo(place_id):
    if not re.fullmatch(r'[0-9]{1,20}', place_id):
        return None
    request = Request('https://place.map.kakao.com/' + place_id, headers={'User-Agent': 'Mozilla/5.0', 'Accept': 'text/html'})
    try:
        with build_opener(NoRedirect).open(request, timeout=8) as response:
            if 'text/html' not in response.headers.get('Content-Type', ''):
                return None
            raw = response.read(1_000_001)
        if len(raw) > 1_000_000:
            return None
        return photo_url(raw.decode('utf-8', errors='replace'))
    except (OSError, ValueError):
        raise RuntimeError('Place photo temporarily unavailable') from None

@router.get('/api/kakao/places/{place_id}/photo')
def place_photo(place_id: str, request: IncomingRequest):
    if not re.fullmatch(r'[0-9]{1,20}', place_id):
        return JSONResponse({'imageUrl': None}, status_code=422, headers=NO_STORE)
    def load():
        admit_request(request)
        return lookup_photo(place_id)
    value = photo_cache.get(place_id, load)
    image = value['imageUrl']
    parsed_image = urlsplit(image) if image else None
    original = urlsplit(parse_qs(parsed_image.query).get('fname', [''])[0]) if parsed_image and parsed_image.path.startswith('/cthumb/local/') else parsed_image
    origin = '네이버 이미지 서버' if original and original.hostname in ('postfiles.pstatic.net', 'blogfiles.pstatic.net') else '카카오 이미지 서버' if original and original.hostname == 't1.kakaocdn.net' else '외부 이미지 서버' if image else None
    return JSONResponse({**value, 'imageOrigin': origin, 'sourceUrl': 'https://place.map.kakao.com/' + place_id, 'source': '카카오맵' if image else None}, headers=NO_STORE)
