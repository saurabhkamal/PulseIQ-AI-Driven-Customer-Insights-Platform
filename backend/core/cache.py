"""
Centralized cache service backed by AWS ElastiCache (Redis-compatible).
All cache access must go through this module — never scatter raw redis calls.
Gracefully degrades to None/pass if ElastiCache is unavailable.
"""
import json
from functools import lru_cache
from typing import Any

import redis.asyncio as aioredis
from redis.asyncio import Redis

from .config import get_settings
from .logging import get_logger

logger = get_logger(__name__)


@lru_cache
def _get_redis_pool() -> Redis:
    settings = get_settings()
    return aioredis.from_url(
        settings.elasticache_url,
        encoding="utf-8",
        decode_responses=True,
        socket_connect_timeout=2,
        socket_timeout=2,
    )


class CacheService:
    def __init__(self) -> None:
        self._redis: Redis = _get_redis_pool()

    async def get(self, key: str) -> Any | None:
        try:
            raw = await self._redis.get(key)
            return json.loads(raw) if raw is not None else None
        except Exception as exc:
            logger.warning("cache_get_failed", key=key, error=str(exc))
            return None

    async def set(self, key: str, value: Any, ttl: int = 60) -> None:
        try:
            await self._redis.setex(key, ttl, json.dumps(value, default=str))
        except Exception as exc:
            logger.warning("cache_set_failed", key=key, error=str(exc))

    async def delete(self, key: str) -> None:
        try:
            await self._redis.delete(key)
        except Exception as exc:
            logger.warning("cache_delete_failed", key=key, error=str(exc))

    async def exists(self, key: str) -> bool:
        try:
            return bool(await self._redis.exists(key))
        except Exception:
            return False

    async def increment(self, key: str, ttl: int = 60) -> int:
        """Atomic increment — used for rate limiting."""
        try:
            pipe = self._redis.pipeline()
            await pipe.incr(key)
            await pipe.expire(key, ttl)
            results = await pipe.execute()
            return int(results[0])
        except Exception as exc:
            logger.warning("cache_incr_failed", key=key, error=str(exc))
            return 0

    # ── Typed key builders ────────────────────────────────────────────────

    @staticmethod
    def dashboard_key(org_id: str, hash_: str) -> str:
        return f"{org_id}:dashboard:{hash_}"

    @staticmethod
    def insight_key(org_id: str, insight_type: str) -> str:
        return f"{org_id}:insight:{insight_type}"

    @staticmethod
    def rate_limit_key(org_id: str, endpoint: str) -> str:
        return f"ratelimit:{org_id}:{endpoint}"

    @staticmethod
    def pipeline_key(job_id: str) -> str:
        return f"pipeline:{job_id}:status"

    @staticmethod
    def session_key(user_id: str) -> str:
        return f"session:{user_id}"


# TTL constants (seconds)
TTL_DASHBOARD = 60
TTL_INSIGHT = 300       # 5 min
TTL_RATE_LIMIT = 60
TTL_PIPELINE = 3600     # 1 hour
TTL_SESSION = 900       # 15 min


_cache_service: CacheService | None = None


def get_cache() -> CacheService:
    global _cache_service
    if _cache_service is None:
        _cache_service = CacheService()
    return _cache_service
