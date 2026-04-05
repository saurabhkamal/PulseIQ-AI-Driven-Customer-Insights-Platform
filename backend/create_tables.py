"""One-time script to create all tables in the database."""
import asyncio
from core.config import get_settings
from core.database import engine, Base

# Import all models so SQLAlchemy registers them
import models.organization  # noqa: F401
import models.user          # noqa: F401
import models.api_key       # noqa: F401
import models.data_source   # noqa: F401
import models.product       # noqa: F401
import models.customer      # noqa: F401
import models.sales         # noqa: F401
import models.event         # noqa: F401
import models.feedback      # noqa: F401
import models.sentiment     # noqa: F401
import models.trend         # noqa: F401
import models.insight       # noqa: F401
import models.dashboard     # noqa: F401
import models.mobile        # noqa: F401
import models.audit         # noqa: F401


async def create_all():
    print("Connecting to database...")
    async with engine.begin() as conn:
        print("Creating tables...")
        await conn.run_sync(Base.metadata.create_all)
    print("All tables created successfully.")
    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(create_all())
