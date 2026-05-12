"""
Rate limiting dependency using CacheService (Redis increment).
Gracefully degrades — if Redis is unavailable, requests pass through.
"""
from fastapi import Request
from core.cache import CacheService, get_cache, TTL_RATE_LIMIT
from core.exceptions import RateLimitError


def rate_limit(max_requests: int = 100, window_seconds: int = 60):
    """
    Returns a FastAPI dependency that enforces a per-org rate limit.
    Usage: Depends(rate_limit(max_requests=5, window_seconds=60))
    """
    async def _check(request: Request) -> None:
        cache: CacheService = get_cache()
        # Scope by org_id from JWT if available, else by IP
        org_id = getattr(getattr(request.state, "user", None), "org_id", None)
        scope = org_id or request.client.host if request.client else "anon"
        key = CacheService.rate_limit_key(scope, request.url.path)
        count = await cache.increment(key, ttl=window_seconds)
        if count > max_requests:
            raise RateLimitError(
                f"Rate limit exceeded: {max_requests} requests per {window_seconds}s"
            )

    return _check
