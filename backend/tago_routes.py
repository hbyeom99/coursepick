"""TAGO bus routing. Distance estimates exclude waiting and traffic conditions."""
from collections import OrderedDict, defaultdict
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from http.client import HTTPException
import hashlib
import heapq
import itertools
import json
import math
import os
from pathlib import Path
import threading
import time
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, unquote
from urllib.request import urlopen


class TransitUnavailable(Exception):
    pass


class NoTransitPath(TransitUnavailable):
    pass


@dataclass(frozen=True)
class Settings:
    timeout_seconds: float = 28
    request_timeout_seconds: float = 6
    max_requests: int = 96
    max_workers: int = 4
    max_candidate_routes: int = 80
    cache_ttl_seconds: float = 21600
    cache_max_entries: int = 1024

    @classmethod
    def load(cls, config=None):
        values = json.loads(Path(__file__).with_name('tago_settings.json').read_text(encoding='utf-8'))
        config = config or {}
        limits = {'timeout_seconds': (1, 60), 'request_timeout_seconds': (1, 10),
                  'max_requests': (1, 200), 'max_workers': (1, 8),
                  'max_candidate_routes': (1, 200), 'cache_ttl_seconds': (0, 86400),
                  'cache_max_entries': (1, 10000)}
        for name, (low, high) in limits.items():
            raw = os.environ.get('TAGO_' + name.upper(), config.get('TAGO_' + name.upper()))
            if raw is not None:
                values[name] = float(raw) if name.endswith('seconds') else int(raw)
            value = values.get(name, getattr(cls(), name))
            if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not low <= value <= high:
                raise ValueError('Invalid TAGO setting: ' + name)
            if not name.endswith('seconds') and not isinstance(value, int):
                raise ValueError('Invalid TAGO integer setting: ' + name)
        return cls(**values)


_CACHE = OrderedDict()
_CACHE_LOCK = threading.Lock()


def distance(a, b):
    lat1, lon1, lat2, lon2 = map(math.radians, [a[0], a[1], b[0], b[1]])
    v = math.sin((lat2-lat1)/2)**2 + math.cos(lat1)*math.cos(lat2)*math.sin((lon2-lon1)/2)**2
    return 6371000 * 2 * math.asin(math.sqrt(min(1, v)))


def coordinate(row):
    lat, lon = float(row['gpslati']), float(row['gpslong'])
    if not math.isfinite(lat+lon) or not 33 <= lat <= 39 or not 124 <= lon <= 132:
        raise ValueError('invalid coordinate')
    return lat, lon


class TagoClient:
    def __init__(self, key, settings=None):
        self.settings = settings or Settings.load()
        self.key = unquote(key.strip())
        self.cache_namespace = hashlib.sha256(self.key.encode()).digest()
        self.deadline = time.monotonic() + self.settings.timeout_seconds
        self.memo = {}
        self.lock = threading.Lock()
        self.request_count = 0

    def check_deadline(self):
        remaining = self.deadline - time.monotonic()
        if remaining <= 0:
            raise TransitUnavailable('대중교통 조회 시간이 초과되었습니다. 다시 시도해 주세요.')
        return remaining

    def get(self, service, operation, **params):
        self.check_deadline()
        cache_key = (self.cache_namespace, service, operation, tuple(sorted(params.items())))
        with self.lock:
            if cache_key in self.memo:
                return self.memo[cache_key]
        # Only static route/station data is cached; no arrival predictions or user data.
        with _CACHE_LOCK:
            cached = _CACHE.get(cache_key)
            if cached and cached[0] > time.monotonic():
                _CACHE.move_to_end(cache_key)
                return cached[1]
            _CACHE.pop(cache_key, None)
        rows = []
        page = 1
        while True:
            remaining = self.check_deadline()
            with self.lock:
                if self.request_count >= self.settings.max_requests:
                    raise TransitUnavailable('대중교통 조회 요청 한도에 도달했습니다. 경로를 끝까지 확인하지 못했습니다.')
                self.request_count += 1
            query = urlencode(dict(serviceKey=self.key, _type='json', numOfRows=1000, pageNo=page, **params))
            try:
                with urlopen('https://apis.data.go.kr/1613000/' + service + '/' + operation + '?' + query,
                             timeout=min(self.settings.request_timeout_seconds, remaining)) as response:
                    body = json.load(response)['response']
                if str(body['header']['resultCode']) not in ('00', '0'):
                    raise TransitUnavailable('TAGO가 조회를 거절했습니다. 인증키·이용량·서비스 상태를 확인해 주세요.')
                data = body.get('body') or {}
                items = (data.get('items') or {}).get('item', [])
                items = [items] if isinstance(items, dict) else items
                if not isinstance(items, list):
                    raise ValueError('invalid items')
                rows.extend(items)
                if len(rows) >= int(data.get('totalCount', 0)):
                    break
                if not items:
                    raise ValueError('incomplete page')
                page += 1
            except TransitUnavailable:
                raise
            except HTTPError as error:
                raise TransitUnavailable(f'TAGO 서버 요청에 실패했습니다(HTTP {error.code}). 잠시 후 다시 시도해 주세요.') from None
            except (OSError, URLError, HTTPException):
                raise TransitUnavailable('TAGO 응답이 지연되거나 연결되지 않습니다. 잠시 후 다시 시도해 주세요.') from None
            except (ValueError, KeyError, TypeError, AttributeError):
                raise TransitUnavailable('TAGO 응답 형식을 확인할 수 없습니다. 서비스 상태를 확인해 주세요.') from None
        self.check_deadline()
        with self.lock:
            self.memo[cache_key] = rows
        if self.settings.cache_ttl_seconds:
            with _CACHE_LOCK:
                _CACHE[cache_key] = (time.monotonic() + self.settings.cache_ttl_seconds, rows)
                _CACHE.move_to_end(cache_key)
                while len(_CACHE) > self.settings.cache_max_entries:
                    _CACHE.popitem(last=False)
        return rows

    def nearby(self, point):
        rows = self.get('BusSttnInfoInqireService', 'getCrdntPrxmtSttnList', gpsLati=point[0], gpsLong=point[1])
        valid = []
        for row in rows:
            try:
                node = dict(row, point=coordinate(row))
                if row.get('citycode') is not None and row.get('nodeid') and distance(point, node['point']) <= 500:
                    valid.append(node)
            except (ValueError, KeyError, TypeError):
                continue
        return sorted(valid, key=lambda node: distance(point, node['point']))[:3]

    def served(self, stop):
        return self.get('BusSttnInfoInqireService', 'getSttnThrghRouteList', cityCode=stop['citycode'], nodeId=stop['nodeid'])

    def stops(self, city, route):
        return self.get('BusRouteInfoInqireService', 'getRouteAcctoThrghSttnList', cityCode=city, routeId=route)

    def many(self, function, values):
        """Bound in-flight requests; all tasks share the same deadline and request budget."""
        values = list(values)
        results = []
        with ThreadPoolExecutor(max_workers=self.settings.max_workers) as pool:
            for offset in range(0, len(values), self.settings.max_workers):
                self.check_deadline()
                futures = [pool.submit(function, value) for value in values[offset:offset+self.settings.max_workers]]
                results.extend(future.result() for future in futures)
        self.check_deadline()
        return results


def solve(start, end, origins, destinations, routes, max_transfers=1, check_deadline=lambda: None):
    # Preserve each stop occurrence: collapsing a circular route by stop ID creates shortcuts.
    vertices = {}
    at_stop = defaultdict(list)
    following = {}
    for route, stops in routes.items():
        check_deadline()
        try:
            ordered = sorted(stops, key=lambda s: int(s['nodeord']))
            if len({int(s['nodeord']) for s in ordered}) != len(ordered):
                raise ValueError('duplicate stop order')
            points = [coordinate(s) for s in ordered]
            for i, (stop, point) in enumerate(zip(ordered, points)):
                vertex = (route, i)
                vertices[vertex] = (str(stop['nodeid']), point)
                at_stop[str(stop['nodeid'])].append(vertex)
                if i:
                    meters = distance(points[i-1], point) * 1.2
                    following[(route, i-1)] = (vertex, meters/(20000/3600)+30, meters)
        except (ValueError, KeyError, TypeError):
            raise TransitUnavailable('노선 정류장 순서나 좌표가 불완전해 경로를 확인할 수 없습니다.') from None
    targets = {str(s['nodeid']) for s in destinations}
    queue = []
    counter = itertools.count()
    best = {}
    answer = None
    for stop in origins:
        meters = distance(start, stop['point']) * 1.3
        walk = meters/(4500/3600)
        for vertex in at_stop[str(stop['nodeid'])]:
            heapq.heappush(queue, (walk, next(counter), vertex, 1, walk, 0, meters, [vertex[0]]))
    while queue:
        check_deadline()
        total, _, vertex, boards, walk, ride, meters, lanes = heapq.heappop(queue)
        state = (vertex, boards)
        if total >= best.get(state, float('inf')):
            continue
        best[state] = total
        node, point = vertices[vertex]
        if node in targets and ride > 0:
            final_meters = distance(point, end) * 1.3
            final_walk = final_meters/(4500/3600)
            candidate = (total+final_walk, walk+final_walk, ride, meters+final_meters, boards-1, lanes)
            if answer is None or candidate[0] < answer[0]:
                answer = candidate
        if vertex in following:
            next_vertex, seconds, length = following[vertex]
            heapq.heappush(queue, (total+seconds, next(counter), next_vertex, boards, walk, ride+seconds, meters+length, lanes))
        if boards <= max_transfers:
            for next_vertex in at_stop[node]:
                if next_vertex[0] != vertex[0]:
                    heapq.heappush(queue, (total, next(counter), next_vertex, boards+1, walk, ride, meters, lanes+[next_vertex[0]]))
    if answer is None:
        raise NoTransitPath('확인한 주변 버스 노선에서 연결 경로를 찾지 못했습니다.')
    return dict(durationSeconds=math.ceil(answer[0]), walkingSeconds=math.ceil(answer[1]),
                ridingSeconds=math.ceil(answer[2]), distanceMeters=round(answer[3]), transfers=answer[4], routeIds=answer[5])


def segment(client, a, b):
    start = (a['latitude'], a['longitude'])
    end = (b['latitude'], b['longitude'])
    origins, destinations = client.many(client.nearby, [start, end])
    if not origins or not destinations:
        raise NoTransitPath('주변 버스 정류장 정보가 없어 이동시간을 계산할 수 없습니다.')
    cities = {str(s['citycode']) for s in origins} & {str(s['citycode']) for s in destinations}
    if not cities:
        raise NoTransitPath('도시 간 이동은 현재 지원하지 않습니다.')
    solutions = []
    # Do not arbitrarily choose the first city when both endpoints are near a city boundary.
    for city in sorted(cities):
        source_stops = [s for s in origins if str(s['citycode']) == city]
        target_stops = [s for s in destinations if str(s['citycode']) == city]
        lists = client.many(client.served, source_stops + target_stops)
        def route_ids(rows):
            return {str(r['routeid']) for group in rows for r in group if r.get('routeid')}
        source_ids = route_ids(lists[:len(source_stops)])
        target_ids = route_ids(lists[len(source_stops):])
        common = source_ids & target_ids
        routes = {}
        def load(ids):
            if len(ids) > client.settings.max_candidate_routes:
                raise TransitUnavailable('확인할 버스 노선이 조회 범위를 초과했습니다. 경로를 끝까지 확인하지 못했습니다.')
            missing = sorted(ids - routes.keys())
            rows = client.many(lambda route: client.stops(city, route), missing)
            routes.update(zip(missing, rows))
        load(common)
        try:
            result = solve(start, end, source_stops, target_stops, routes,
                           max_transfers=0, check_deadline=client.check_deadline)
            scope = 'direct-first'
        except NoTransitPath:
            # Any bus-only one-transfer route must start/end on these endpoint route sets.
            load(source_ids | target_ids)
            try:
                result = solve(start, end, source_stops, target_stops, routes,
                               max_transfers=1, check_deadline=client.check_deadline)
                scope = 'up-to-one-transfer'
            except NoTransitPath:
                continue
        solutions.append(dict(result, searchScope=scope))
    if not solutions:
        raise NoTransitPath('주변 정류장과 버스 환승 1회 범위에서 연결 경로를 찾지 못했습니다.')
    result = min(solutions, key=lambda item: item['durationSeconds'])
    return dict(result, fromId=a['id'], toId=b['id'], source='TAGO', method='distance-model',
                waitingIncluded=False, optimalityGuaranteed=False)
