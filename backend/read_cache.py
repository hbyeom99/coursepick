"""Bounded, process-local cache for public reads; never caches authentication."""
from collections import OrderedDict
from copy import deepcopy
from threading import RLock
from time import monotonic


class ReadCache:
    def __init__(self, ttl=30, capacity=16):
        self.ttl, self.capacity = ttl, capacity
        self.entries, self.lock = OrderedDict(), RLock()

    def clear(self):
        with self.lock:
            self.entries.clear()

    def read(self, key, loader):
        with self.lock:
            now = monotonic()
            for stale in [k for k, (until, _) in self.entries.items() if until <= now]:
                del self.entries[stale]
            if key in self.entries:
                self.entries.move_to_end(key)
                return deepcopy(self.entries[key][1])
            value = loader()  # Errors are not cached.
            self.entries[key] = (monotonic() + self.ttl, deepcopy(value))
            while len(self.entries) > self.capacity:
                self.entries.popitem(last=False)
            return deepcopy(value)
