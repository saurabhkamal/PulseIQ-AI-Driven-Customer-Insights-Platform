from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
from collections.abc import AsyncGenerator

from .config import get_settings

settings = get_settings()

_connect_args = {"ssl": "require"} if "supabase.co" in settings.database_url else {}

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    connect_args=_connect_args,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that provides a DB session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def set_org_context(session: AsyncSession, org_id: str) -> None:
    """Set app.current_org_id on the DB session for RLS enforcement."""
    await session.execute(
        text("SELECT set_config('app.current_org_id', :org_id, TRUE)"),
        {"org_id": org_id},
    )
