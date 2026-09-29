"""A tiny in-memory rate limiter, enough for a single API container.

It protects the free OpenRouteService quota from being used up by one
visitor. Behind CloudFront the real client address is the first entry of
X-Forwarded-For.
"""

import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request


class RateLimiter:
    def __init__(self, max_calls: int, period_s: float):
        self.max_calls = max_calls
        self.period_s = period_s
        self.calls: dict[str, deque[float]] = defaultdict(deque)

    def reset(self) -> None:
        self.calls.clear()

    def __call__(self, request: Request) -> None:
        forwarded = request.headers.get("x-forwarded-for", "")
        client = forwarded.split(",")[0].strip() or (request.client.host if request.client else "unknown")
        now = time.monotonic()
        calls = self.calls[client]
        while calls and now - calls[0] > self.period_s:
            calls.popleft()
        if len(calls) >= self.max_calls:
            raise HTTPException(status_code=429, detail="Too many requests, try again in a minute")
        calls.append(now)


plan_trip_limit = RateLimiter(max_calls=10, period_s=60)
geocode_limit = RateLimiter(max_calls=60, period_s=60)
