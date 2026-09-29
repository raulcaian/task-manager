"""A tiny in-memory rate limiter, enough for a single API container.

It keeps one visitor from using up the free routing and search services
or flooding the contact form. Behind CloudFront the real client address is the first entry of
X-Forwarded-For.
"""

import time
from collections import defaultdict, deque

from fastapi import HTTPException, Request


def client_address(request: Request) -> str:
    """The visitor's IP: behind CloudFront it is the first X-Forwarded-For entry."""
    forwarded = request.headers.get("x-forwarded-for", "")
    return forwarded.split(",")[0].strip() or (request.client.host if request.client else "unknown")


class RateLimiter:
    def __init__(self, max_calls: int, period_s: float):
        self.max_calls = max_calls
        self.period_s = period_s
        self.calls: dict[str, deque[float]] = defaultdict(deque)

    def reset(self) -> None:
        self.calls.clear()

    def __call__(self, request: Request) -> None:
        client = client_address(request)
        now = time.monotonic()
        calls = self.calls[client]
        while calls and now - calls[0] > self.period_s:
            calls.popleft()
        if len(calls) >= self.max_calls:
            raise HTTPException(status_code=429, detail="Too many requests, try again in a minute")
        calls.append(now)


plan_trip_limit = RateLimiter(max_calls=10, period_s=60)
geocode_limit = RateLimiter(max_calls=60, period_s=60)
