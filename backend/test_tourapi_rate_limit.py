import unittest
from unittest.mock import patch
from kakao_rate_limit import KakaoRequestLimiter
import tourapi_rate_limit as t
class Tests(unittest.TestCase):
 def test_client_window(self):
  now=[0];limit=KakaoRequestLimiter(clock=lambda:now[0])
  with patch.object(t,'limiter',limit):
   for _ in range(30):t.admit_tourapi_call('a')
   with self.assertRaises(t.TourApiLimitError) as caught:t.admit_tourapi_call('a')
   self.assertEqual(caught.exception.retry_after_seconds,60)
   self.assertEqual(len(limit.global_calls),30)
   now[0]=60;t.admit_tourapi_call('a');self.assertEqual(len(limit.global_calls),1)
 def test_global_limit(self):
  limit=KakaoRequestLimiter(clock=lambda:0)
  with patch.object(t,'limiter',limit):
   for i in range(10):
    for _ in range(30):t.admit_tourapi_call(str(i))
   with self.assertRaises(t.TourApiLimitError):t.admit_tourapi_call('another')
 def test_provider_isolation(self):
  from kakao_rate_limit import limiter
  self.assertIsNot(limiter,t.limiter)
if __name__=='__main__':unittest.main()
