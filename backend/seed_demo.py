"""Seed a demo organization and admin user for local development."""
import asyncio
from sqlalchemy import text
from core.database import engine, Base, AsyncSessionLocal
from core.security import hash_password
from models.organization import Organization
from models.user import User

# Import all models so SQLAlchemy registers them before create_all
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

DEMO_EMAIL = "admin@democorp.com"
DEMO_PASSWORD = "password123"
DEMO_ORG = "DemoCorp"
DEMO_SLUG = "democorp"


async def seed():
    print("Creating tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("Tables ready.")

    async with AsyncSessionLocal() as session:
        result = await session.execute(
            text("SELECT id FROM organizations WHERE slug = :slug"),
            {"slug": DEMO_SLUG},
        )
        existing_org = result.scalar_one_or_none()

        if existing_org:
            print(f"Demo org '{DEMO_ORG}' already exists — checking user...")
            org_id = existing_org
        else:
            org = Organization(name=DEMO_ORG, slug=DEMO_SLUG)
            session.add(org)
            await session.flush()
            org_id = org.id
            print(f"Created org '{DEMO_ORG}' (id={org_id})")

        result = await session.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": DEMO_EMAIL},
        )
        existing_user = result.scalar_one_or_none()

        if existing_user:
            print(f"User '{DEMO_EMAIL}' already exists — skipping.")
        else:
            user = User(
                organization_id=org_id,
                email=DEMO_EMAIL,
                name="Demo Admin",
                role="admin",
                hashed_password=hash_password(DEMO_PASSWORD),
                is_active=True,
            )
            session.add(user)
            await session.commit()
            print(f"Created user '{DEMO_EMAIL}' with password '{DEMO_PASSWORD}'")

    await engine.dispose()
    print("\nSeed complete. You can now log in with:")
    print(f"  Email:    {DEMO_EMAIL}")
    print(f"  Password: {DEMO_PASSWORD}")


if __name__ == "__main__":
    asyncio.run(seed())
