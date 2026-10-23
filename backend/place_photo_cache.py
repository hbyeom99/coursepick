"""Bounded process-local photo URL cache. No page bodies or files."""
from collections import OrderedDict
from concurrent.futures import Future
from threading import Lock, BoundedSemaphore
import time
import math
from fastapi import HTTPException

class PhotoCache:
    def __init__(self, clock=time.monotonic, capacity=512):
        self.clock, self.capacity = clock, capacity
        self.entries, self.pending = OrderedDict(), {}
        self.lock, self.slots = Lock(), BoundedSemaphore(3)

    def get(self, place_id, loader):
        with self.lock:
            cached = self.entries.get(place_id)
            if cached and cached[0] > self.clock():
                self.entries.move_to_end(place_id)
                return {**cached[1], 'retryAfterSeconds': max(1, math.ceil(cached[0] - self.clock()))}
            self.entries.pop(place_id, None)
            future = self.pending.get(place_id)
            owner = future is None
            if owner:
                if len(self.pending) >= 32:
                    return {'imageUrl': None, 'retryAfterSeconds': 60}
                future = self.pending[place_id] = Future()
        if not owner:
            return future.result(timeout=12)
        try:
            acquired = self.slots.acquire(timeout=1)
            try:
                image = loader() if acquired else None
                ttl = 3600 if image else 600 if acquired else 60
            finally:
                if acquired:
                    self.slots.release()
            value = {'imageUrl': image, 'retryAfterSeconds': ttl}
        except HTTPException as error:
            with self.lock:
                self.pending.pop(place_id, None)
                future.set_exception(error)
            raise
        except Exception:
            value = {'imageUrl': None, 'retryAfterSeconds': 60}
        with self.lock:
            self.entries[place_id] = (self.clock() + value['retryAfterSeconds'], value)
            while len(self.entries) > self.capacity:
                self.entries.popitem(last=False)
            self.pending.pop(place_id, None)
            future.set_result(value)
        return value
