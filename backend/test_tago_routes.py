import io
import json
import unittest
import os
from unittest.mock import patch
from concurrent.futures import ThreadPoolExecutor
import threading
import time

import tago_routes as t


def stop(name, order, lon=126.92):
    return dict(nodeid=name, nodeord=order, gpslati=35.15, gpslong=lon, citycode=24,
                point=(35.15, lon))


A = stop('A', 1)
B = stop('B', 2, 126.93)
C = stop('C', 3, 126.94)


def solve(routes, origins=None, destinations=None, **kwargs):
    return t.solve(A['point'], C['point'], origins or [A], destinations or [C], routes, **kwargs)


class FakeClient:
    settings = t.Settings()
    def __init__(self, direct=True, reverse=False, overflow=False):
        self.loaded = []
        self.direct = direct
        self.reverse = reverse
        self.overflow = overflow
    def check_deadline(self):
        return 28
    def many(self, fn, values):
        return [fn(v) for v in values]
    def nearby(self, point):
        return [A] if point == A['point'] else [C]
    def served(self, node):
        prefix = 'o' if node['nodeid'] == 'A' else 'd'
        count = 50 if self.overflow else 15
        ids = [prefix+str(i) for i in range(count)]
        if self.direct:
            ids += ['direct']
        return [dict(routeid=i) for i in ids]
    def stops(self, city, route):
        self.loaded.append(route)
        if route == 'direct':
            return [stop('C', 1, 126.94), stop('A', 2)] if self.reverse else [A, C]
        if route == 'o0':
            return [A, B]
        if route == 'd0':
            return [B, C]
        return []


class RoutingTests(unittest.TestCase):
    def setUp(self):
        with t._CACHE_LOCK:
            t._CACHE.clear()

    def test_direction(self):
        with self.assertRaises(t.NoTransitPath):
            solve({'reverse': [stop('C', 1, 126.94), stop('A', 2)]})

    def test_one_transfer(self):
        result = solve({'r1': [A, B], 'r2': [B, C]})
        self.assertEqual(result['routeIds'], ['r1', 'r2'])
        self.assertEqual(result['transfers'], 1)
        with self.assertRaises(t.NoTransitPath):
            solve({'r1': [A, B], 'r2': [B, C]}, max_transfers=0)

    def test_two_transfers_rejected(self):
        D = stop('D', 4, 126.95)
        with self.assertRaises(t.NoTransitPath):
            t.solve(A['point'], D['point'], [A], [D], {'r1': [A, B], 'r2': [B, C], 'r3': [C, D]})

    def test_circular_route_preserves_occurrences(self):
        # A occurs again after a long detour. Starting from B cannot jump to the first A.
        D = stop('D', 2, 127.1)
        route = [A, D, stop('B', 3, 126.93), stop('A', 4), stop('C', 5, 126.94)]
        result = t.solve(B['point'], C['point'], [B], [C], {'loop': route})
        expected = (t.distance(B['point'], A['point']) + t.distance(A['point'], C['point']))*1.2/(20000/3600)+60
        self.assertEqual(result['ridingSeconds'], __import__('math').ceil(expected))
        # After the second A the bus goes to C, not back to the earlier D.
        with self.assertRaises(t.NoTransitPath):
            t.solve(B['point'], D['point'], [B], [D], {'loop': route})

    def test_more_than_20_routes_direct_first(self):
        client = FakeClient()
        result = t.segment(client, dict(id='a', latitude=35.15, longitude=126.92),
                           dict(id='c', latitude=35.15, longitude=126.94))
        self.assertEqual(client.loaded, ['direct'])
        self.assertEqual(result['searchScope'], 'direct-first')
        self.assertFalse(result['optimalityGuaranteed'])

    def test_reverse_direct_falls_back_to_transfer(self):
        client = FakeClient(reverse=True)
        result = t.segment(client, dict(id='a', latitude=35.15, longitude=126.92),
                           dict(id='c', latitude=35.15, longitude=126.94))
        self.assertEqual(result['routeIds'], ['o0', 'd0'])
        self.assertEqual(result['searchScope'], 'up-to-one-transfer')

    def test_budget_does_not_claim_no_path(self):
        client = FakeClient(direct=False, overflow=True)
        with self.assertRaises(t.TransitUnavailable) as error:
            t.segment(client, dict(id='a', latitude=35.15, longitude=126.92),
                      dict(id='c', latitude=35.15, longitude=126.94))
        self.assertNotIsInstance(error.exception, t.NoTransitPath)
        self.assertIn('끝까지', str(error.exception))

    def test_cache_and_pagination(self):
        def response(page):
            return io.BytesIO(json.dumps({'response': {'header': {'resultCode': '00'},
                'body': {'totalCount': 2, 'items': {'item': [dict(nodeid=str(page))]}}}}).encode())
        with patch.object(t, 'urlopen', side_effect=[response(1), response(2)]) as request:
            rows = t.TagoClient('key').get('svc', 'op')
            self.assertEqual(len(rows), 2)
            self.assertEqual(t.TagoClient('key').get('svc', 'op'), rows)
            self.assertEqual(request.call_count, 2)
            self.assertIn('pageNo=2', request.call_args.args[0])

    def test_deadline_and_request_budget(self):
        client = t.TagoClient('key')
        client.deadline = 0
        with self.assertRaisesRegex(t.TransitUnavailable, '시간이 초과'):
            client.get('svc', 'op')
        client = t.TagoClient('key', t.Settings(max_requests=1))
        body = {'response': {'header': {'resultCode': '00'}, 'body': {'totalCount': 2, 'items': {'item': [{}]}}}}
        with patch.object(t, 'urlopen', return_value=io.BytesIO(json.dumps(body).encode())):
            with self.assertRaisesRegex(t.TransitUnavailable, '요청 한도'):
                client.get('svc', 'op')

    def test_malformed_response_never_exposes_secret(self):
        with patch.object(t, 'urlopen', return_value=io.BytesIO(b'<error>secret-key</error>')):
            with self.assertRaises(t.TransitUnavailable) as error:
                t.TagoClient('secret-key').get('svc', 'op')
            self.assertNotIn('secret-key', str(error.exception))

    def test_concurrency_bound(self):
        active = 0
        peak = 0
        lock = threading.Lock()
        def task(value):
            nonlocal active, peak
            with lock:
                active += 1
                peak = max(peak, active)
            time.sleep(.01)
            with lock:
                active -= 1
            return value
        client = t.TagoClient('key', t.Settings(max_workers=2))
        self.assertEqual(client.many(task, range(6)), list(range(6)))
        self.assertEqual(peak, 2)

    def test_invalid_order_is_not_invented(self):
        with self.assertRaises(t.TransitUnavailable) as error:
            solve({'broken': [A, dict(C, nodeord=1)]})
        self.assertNotIsInstance(error.exception, t.NoTransitPath)

    def test_settings_precedence_and_validation(self):
        with patch.dict(os.environ, {'TAGO_MAX_WORKERS': '3'}):
            self.assertEqual(t.Settings.load({'TAGO_MAX_WORKERS': '2'}).max_workers, 3)
        with patch.dict(os.environ, {'TAGO_MAX_WORKERS': '0'}):
            with self.assertRaises(ValueError):
                t.Settings.load()

    def test_cache_is_bounded_and_key_scoped(self):
        body = {'response': {'header': {'resultCode': '00'}, 'body': {'totalCount': 0}}}
        def response(*args, **kwargs):
            return io.BytesIO(json.dumps(body).encode())
        with patch.object(t, 'urlopen', side_effect=response) as request:
            for key in ['one', 'two']:
                t.TagoClient(key, t.Settings(cache_max_entries=1)).get('svc', 'op')
            self.assertEqual(request.call_count, 2)
            self.assertEqual(len(t._CACHE), 1)


if __name__ == '__main__':
    unittest.main()
