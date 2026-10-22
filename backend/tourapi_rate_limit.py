"""TourAPI admission: provider-isolated, process-local sliding window."""
import hashlib
from fastapi import HTTPException
from kakao_rate_limit import KakaoRequestLimiter

class TourApiLimitError(Exception):
    def __init__(self,seconds):
        self.retry_after_seconds=seconds
        super().__init__(f'TourAPI 호출 제한입니다. {seconds}초 후 수집을 재개해 주세요.')

# Same numerical limits as Kakao, but never consume Kakao's counters.
limiter=KakaoRequestLimiter(per_client=30,global_limit=300,window=60)

def admit_tourapi_call(client='collector',cost=1):
    try:limiter.admit(hashlib.sha256(str(client).encode()).digest(),cost)
    except HTTPException as error:
        if error.status_code!=429:raise
        raise TourApiLimitError(int(error.detail['retryAfterSeconds'])) from None
