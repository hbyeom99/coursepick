"""TAGO bus candidates; walking/riding model excludes waiting. No other routing API."""
import heapq
import itertools
import json
import math
import time
from urllib.parse import urlencode, unquote
from urllib.request import urlopen

class TransitUnavailable(Exception):
    pass

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
    def __init__(self, key):
        self.key = unquote(key)
        self.deadline = time.monotonic()+28
        self.memo = {}
    def get(self, service, operation, **params):
        cache_key = (service, operation, tuple(sorted(params.items())))
        if cache_key in self.memo:
            return self.memo[cache_key]
        remaining = self.deadline-time.monotonic()
        if remaining <= 0:
            raise TransitUnavailable('대중교통 조회 시간이 초과되었습니다. 다시 시도해 주세요.')
        query = urlencode(dict(serviceKey=self.key, _type='json', numOfRows=1000, pageNo=1, **params))
        try:
            with urlopen('https://apis.data.go.kr/1613000/'+service+'/'+operation+'?'+query, timeout=min(6, remaining)) as response:
                body = json.load(response)['response']
            if str(body['header']['resultCode']) not in ('00', '0'):
                raise ValueError('TAGO response error')
            data = body.get('body', {})
            if int(data.get('totalCount', 0)) > 1000:
                raise TransitUnavailable('노선 정보가 많아 이 구간을 계산할 수 없습니다.')
            rows = (data.get('items') or {}).get('item', [])
            rows = [rows] if isinstance(rows, dict) else rows
            self.memo[cache_key] = rows
            return rows
        except TransitUnavailable:
            raise
        except Exception:
            raise TransitUnavailable('TAGO 정보를 조회하지 못했습니다. 서비스 이용 설정을 확인해 주세요.') from None
    def nearby(self, point):
        rows = self.get('BusSttnInfoInqireService', 'getCrdntPrxmtSttnList', gpsLati=point[0], gpsLong=point[1])
        valid = []
        for row in rows:
            try:
                node = dict(row, point=coordinate(row))
                if row.get('citycode') is not None and row.get('nodeid') and distance(point,node['point']) <= 500:
                    valid.append(node)
            except (ValueError, KeyError, TypeError):
                continue
        return sorted(valid, key=lambda node:distance(point,node['point']))[:3]
    def served(self, stop):
        return self.get('BusSttnInfoInqireService', 'getSttnThrghRouteList', cityCode=stop['citycode'], nodeId=stop['nodeid'])
    def stops(self, city, route):
        return self.get('BusRouteInfoInqireService', 'getRouteAcctoThrghSttnList', cityCode=city, routeId=route)

def solve(start, end, origins, destinations, routes):
    graph = {}; nodes = {}
    for route, stops in routes.items():
        valid = []
        for stop in sorted(stops, key=lambda s:int(s.get('nodeord',0))):
            try:
                node = str(stop['nodeid']); point = coordinate(stop)
                nodes[node] = point; valid.append((node,point))
            except (ValueError, KeyError, TypeError):
                continue
        for (a,pa),(b,pb) in zip(valid,valid[1:]):
            meters = distance(pa,pb)
            # 20 km/h bus model, road factor 1.2, 30 seconds per stop.
            seconds = meters*1.2/(20000/3600)+30
            graph.setdefault(a,[]).append((b,route,seconds,meters*1.2))
    targets = {str(s['nodeid']):s for s in destinations}
    queue=[]; counter=itertools.count(); best={}; answer=None
    for stop in origins:
        node = str(stop['nodeid']); meters=distance(start,stop['point'])*1.3
        walk = meters/(4500/3600)
        heapq.heappush(queue,(walk,next(counter),node,None,0,walk,0,meters,[]))
    while queue:
        total,_,node,last,boards,walk,ride,meters,lanes=heapq.heappop(queue)
        state=(node,last,boards)
        if total >= best.get(state,float('inf')):continue
        best[state]=total
        if node in targets and boards:
            final_meters=distance(targets[node]['point'],end)*1.3
            final_walk=final_meters/(4500/3600)
            candidate=(total+final_walk,walk+final_walk,ride,meters+final_meters,boards-1,lanes)
            if answer is None or candidate[0]<answer[0]:answer=candidate
        for next_node,route,seconds,length in graph.get(node,[]):
            changed=route!=last; count=boards+int(changed)
            if count>2:continue
            heapq.heappush(queue,(total+seconds,next(counter),next_node,route,count,walk,ride+seconds,meters+length,lanes+([route] if changed else [])))
    if answer is None:raise TransitUnavailable('연결 가능한 버스 노선을 찾지 못했습니다. 이 구간의 이동시간은 표시하지 않습니다.')
    return dict(durationSeconds=math.ceil(answer[0]),walkingSeconds=math.ceil(answer[1]),ridingSeconds=math.ceil(answer[2]),distanceMeters=round(answer[3]),transfers=answer[4],routeIds=answer[5])

def segment(client, a, b):
    start=(a['latitude'],a['longitude']);end=(b['latitude'],b['longitude'])
    origins=client.nearby(start);destinations=client.nearby(end)
    if not origins or not destinations:raise TransitUnavailable('주변 버스 정류장 정보가 없어 이동시간을 계산할 수 없습니다.')
    cities={str(s['citycode']) for s in origins}&{str(s['citycode']) for s in destinations}
    if not cities:raise TransitUnavailable('도시 간 이동은 현재 지원하지 않습니다.')
    city=sorted(cities)[0];origins=[s for s in origins if str(s['citycode'])==city];destinations=[s for s in destinations if str(s['citycode'])==city]
    ids=set()
    for stop in origins+destinations:
        ids.update(str(r['routeid']) for r in client.served(stop) if r.get('routeid'))
    if len(ids)>20:raise TransitUnavailable('노선 후보가 많아 이동시간을 계산할 수 없습니다.')
    routes={route:client.stops(city,route) for route in sorted(ids)}
    result=solve(start,end,origins,destinations,routes)
    return dict(result,fromId=a['id'],toId=b['id'],source='TAGO',method='distance-model',waitingIncluded=False)
