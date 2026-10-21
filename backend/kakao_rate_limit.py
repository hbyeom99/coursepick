"""Bounded in-process admission counters; no search content is cached."""
from collections import deque
from threading import Lock
import math,time,hashlib
from fastapi import HTTPException

class KakaoRequestLimiter:
    def __init__(self,per_client=30,global_limit=300,window=60,clock=time.monotonic):
        self.per_client,self.global_limit,self.window,self.clock=per_client,global_limit,window,clock
        self.clients={};self.global_calls=deque();self.lock=Lock()
    def admit(self,client,cost=1):
        if cost<=0:return
        with self.lock:
            now=self.clock();cutoff=now-self.window
            while self.global_calls and self.global_calls[0]<=cutoff:self.global_calls.popleft()
            for key,events in list(self.clients.items()):
                while events and events[0]<=cutoff:events.popleft()
                if not events:del self.clients[key]
            calls=self.clients.get(client,deque())
            retry=0
            if len(calls)+cost>self.per_client:retry=max(retry,self.window-(now-calls[0]) if calls else self.window)
            if len(self.global_calls)+cost>self.global_limit:retry=max(retry,self.window-(now-self.global_calls[0]) if self.global_calls else self.window)
            if client not in self.clients and len(self.clients)>=4096:retry=max(retry,self.window)
            if retry:
                seconds=max(1,math.ceil(retry))
                raise HTTPException(429,dict(message='검색 요청이 많습니다. 잠시 후 다시 검색해 주세요.',retryAfterSeconds=seconds),headers={'Retry-After':str(seconds),'Cache-Control':'no-store, private'})
            calls.extend([now]*cost);self.clients[client]=calls;self.global_calls.extend([now]*cost)

limiter=KakaoRequestLimiter()
def admit_request(request,cost=1):
    if request is None:return # Direct trusted Python callers; HTTP always injects Request.
    host=request.client.host if request.client else 'unknown'
    # Ignore user-supplied forwarding headers; the server/proxy trust configuration owns client IP handling.
    limiter.admit(hashlib.sha256(host.encode()).digest(),cost)
