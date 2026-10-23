"""No external API/DB calls: TTL, concurrent deduplication and capacity checks."""
import sys, unittest, threading, time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'backend'))
from place_photo_cache import PhotoCache

class PhotoCacheTests(unittest.TestCase):
    def test_success_missing_and_error_expiry(self):
        now=[0]
        cache=PhotoCache(clock=lambda:now[0])
        calls=[]
        def load(): calls.append(1); return 'https://image'
        self.assertEqual(cache.get('1',load)['imageUrl'],'https://image')
        now[0]=3590
        self.assertEqual(cache.get('1',load)['retryAfterSeconds'],10)
        self.assertEqual(len(calls),1)
        now[0]=3601
        cache.get('1',load)
        self.assertEqual(len(calls),2)
        self.assertEqual(cache.get('2',lambda:None)['retryAfterSeconds'],600)
        def fail(): raise OSError()
        self.assertEqual(cache.get('3',fail)['retryAfterSeconds'],60)

    def test_simultaneous_requests_share_one_lookup(self):
        cache=PhotoCache();calls=[];start=threading.Event()
        def load():
            calls.append(1);start.wait(1);return 'photo'
        with ThreadPoolExecutor(max_workers=8) as pool:
            work=[pool.submit(cache.get,'same',load) for _ in range(8)]
            time.sleep(.03);start.set()
            self.assertTrue(all(f.result()['imageUrl']=='photo' for f in work))
        self.assertEqual(len(calls),1)

    def test_capacity_and_global_concurrency(self):
        cache=PhotoCache(capacity=2);counts=[0,0];lock=threading.Lock()
        def load():
            with lock: counts[0]+=1;counts[1]=max(counts)
            time.sleep(.03)
            with lock: counts[0]-=1
            return 'photo'
        with ThreadPoolExecutor(max_workers=8) as pool:
            list(pool.map(lambda n:cache.get(str(n),load),range(8)))
        self.assertLessEqual(counts[1],3)
        self.assertEqual(len(cache.entries),2)

if __name__=='__main__':unittest.main()
