"""
PulseIQ — Demo Seed Script
Drops and recreates all tables, then populates with realistic demo data.
Run: python seed.py
"""
import asyncio
import hashlib
import random
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from core.config import get_settings
from core.database import Base
from core.security import hash_password

# ── import every model so Base.metadata knows about them ──────────────────────
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

from models.organization import Organization
from models.user import User
from models.api_key import ApiKey
from models.data_source import DataSource
from models.product import Product
from models.customer import Customer
from models.sales import SaleData
from models.event import ConsumerEvent
from models.feedback import Feedback
from models.sentiment import SentimentResult
from models.trend import TrendPrediction
from models.insight import Insight
from models.dashboard import Dashboard
from models.mobile import DeviceToken, MobileNotification, MobilePreference
from models.audit import AuditLog

settings = get_settings()
rng = random.Random(42)


# ── helpers ───────────────────────────────────────────────────────────────────

def uid() -> str:
    return str(uuid.uuid4())


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def days_ago(n: float) -> datetime:
    return now_utc() - timedelta(days=n)


def rand_date(start_days_ago: int, end_days_ago: int = 0) -> datetime:
    delta = rng.uniform(end_days_ago, start_days_ago)
    return now_utc() - timedelta(days=delta)


def api_key_hash(raw: str) -> str:
    return hashlib.sha256(raw.encode()).hexdigest()


# ── constants / lookup tables ─────────────────────────────────────────────────

PRODUCT_CATALOG = [
    # (name, category, subcategory, price)
    ("Wireless Noise-Cancelling Headphones", "Electronics", "Audio", 249.99),
    ("4K Ultra HD Smart TV 55\"", "Electronics", "Televisions", 799.99),
    ("Mechanical Gaming Keyboard RGB", "Electronics", "Peripherals", 129.99),
    ("Ergonomic Office Chair", "Furniture", "Seating", 449.99),
    ("Standing Desk Adjustable 60\"", "Furniture", "Desks", 599.99),
    ("Yoga Mat Premium Non-Slip", "Sports", "Yoga", 49.99),
    ("Running Shoes Pro X12", "Sports", "Footwear", 119.99),
    ("Dumbbell Set 5-50 lbs", "Sports", "Weights", 329.99),
    ("Stainless Steel Water Bottle 32oz", "Home", "Kitchen", 29.99),
    ("Air Purifier HEPA 500 sqft", "Home", "Air Quality", 199.99),
    ("Vitamin D3 + K2 Supplement", "Health", "Vitamins", 24.99),
    ("Whey Protein Isolate 5lb", "Health", "Supplements", 69.99),
    ("Face Serum Hyaluronic Acid", "Beauty", "Skincare", 39.99),
    ("Electric Toothbrush Sonic Pro", "Beauty", "Oral Care", 89.99),
    ("Coffee Maker Programmable 12-Cup", "Home", "Appliances", 79.99),
    ("Instant Pot Duo 7-in-1 6Qt", "Home", "Appliances", 99.99),
    ("Men's Slim Fit Dress Shirt", "Fashion", "Men", 49.99),
    ("Women's Yoga Leggings High Waist", "Fashion", "Women", 59.99),
    ("Kids Backpack Waterproof 20L", "Fashion", "Kids", 34.99),
    ("Bluetooth Speaker Waterproof", "Electronics", "Audio", 79.99),
    ("Smart Watch Fitness Tracker", "Electronics", "Wearables", 199.99),
    ("Gaming Mouse 16000 DPI", "Electronics", "Peripherals", 69.99),
    ("Laptop Stand Adjustable Aluminum", "Electronics", "Accessories", 44.99),
    ("Monitor 27\" QHD IPS 144Hz", "Electronics", "Monitors", 399.99),
    ("Resistance Bands Set 5-Pack", "Sports", "Training", 24.99),
    ("Foam Roller Deep Tissue", "Sports", "Recovery", 34.99),
    ("Cycling Helmet MIPS Safety", "Sports", "Cycling", 89.99),
    ("Protein Bar Variety Pack 24ct", "Health", "Snacks", 44.99),
    ("Multivitamin Men's Daily", "Health", "Vitamins", 19.99),
    ("Retinol Night Cream 1oz", "Beauty", "Skincare", 54.99),
    ("Perfume Floral Eau de Parfum", "Beauty", "Fragrance", 79.99),
    ("Non-Stick Cookware Set 10pc", "Home", "Kitchen", 149.99),
    ("Bamboo Cutting Board Set 3pc", "Home", "Kitchen", 39.99),
    ("Weighted Blanket 15lbs Queen", "Home", "Bedding", 79.99),
    ("Pillow Memory Foam Queen", "Home", "Bedding", 49.99),
    ("Men's Casual Chino Pants", "Fashion", "Men", 44.99),
    ("Women's Summer Dress Floral", "Fashion", "Women", 54.99),
    ("Wireless Charging Pad 15W", "Electronics", "Accessories", 29.99),
    ("USB-C Hub 7-in-1", "Electronics", "Accessories", 49.99),
    ("Smart Home Security Camera", "Electronics", "Smart Home", 89.99),
    ("Jump Rope Speed Cable", "Sports", "Cardio", 19.99),
    ("Protein Powder Vegan 2lb", "Health", "Supplements", 54.99),
    ("Sunscreen SPF 50 Mineral", "Beauty", "Skincare", 22.99),
    ("Hair Dryer Ionic 1875W", "Beauty", "Hair Care", 74.99),
    ("Robot Vacuum Auto Mapping", "Home", "Cleaning", 299.99),
    ("Candle Soy Wax Gift Set 3pc", "Home", "Decor", 39.99),
    ("Kids STEM Science Kit", "Toys", "Educational", 44.99),
    ("Board Game Strategy Premium", "Toys", "Games", 49.99),
    ("Dog Collar Reflective Adjustable", "Pets", "Accessories", 19.99),
    ("Cat Tree Multi-Level 54\"", "Pets", "Furniture", 89.99),
]

CUSTOMER_SEGMENTS = ["premium", "regular", "new", "at_risk", "churned"]
REGIONS = ["North America", "Europe", "Asia Pacific", "Latin America", "Middle East"]
FEEDBACK_SOURCES = ["website", "email", "survey", "app", "other"]
EVENT_TYPES = ["view", "click", "add_to_cart", "remove_from_cart", "purchase", "review", "search", "other"]

POSITIVE_FEEDBACK = [
    "Absolutely love this product! Exceeded my expectations in every way.",
    "Amazing quality, fast shipping. Will definitely buy again.",
    "Best purchase I've made this year. Highly recommend to everyone.",
    "Outstanding product. Works exactly as described, very happy.",
    "Five stars! Perfect quality and arrived ahead of schedule.",
    "Great value for money. The build quality is superb.",
    "Exceeded all my expectations. This is a fantastic product.",
    "Couldn't be happier with this purchase. Works perfectly.",
    "The quality is incredible for the price. Very impressed.",
    "Love everything about this. Will be purchasing more items.",
    "Impressive product! Setup was easy and it works flawlessly.",
    "Exactly what I needed. Great quality and fast delivery.",
    "Perfect in every way. Highly satisfied with this purchase.",
    "Phenomenal product. Customer service was also excellent.",
    "So happy with this! It has made my life so much easier.",
]

NEUTRAL_FEEDBACK = [
    "It's okay, does what it's supposed to do. Nothing special.",
    "Average product. Works fine but not as impressive as expected.",
    "Decent quality for the price. Shipping took longer than expected.",
    "Product is fine. Nothing extraordinary but gets the job done.",
    "Not bad. Has some good features but also a few drawbacks.",
    "It's acceptable. Would have preferred better packaging.",
    "Works as described. Nothing more, nothing less.",
    "Good but not great. Some minor quality issues noticed.",
    "Average experience overall. Product works but has room for improvement.",
    "Satisfactory purchase. Expected slightly better quality.",
]

NEGATIVE_FEEDBACK = [
    "Very disappointed. Product stopped working after just two weeks.",
    "Poor quality. Broke within a month. Not worth the price.",
    "Not as described. Completely different from the product images.",
    "Terrible customer service. Product arrived damaged and no support.",
    "Avoid this product. Cheaply made and doesn't work properly.",
    "Waste of money. Returned it immediately after seeing the quality.",
    "Product is defective. Stopped working after the first use.",
    "Very unhappy with this purchase. Expected much better quality.",
    "Do not buy. False advertising. Nothing like what was shown.",
    "Disappointed with the build quality. Feels very cheap.",
]

TREND_DATA = [
    ("Sustainable & Eco-Friendly Products Surge", "Electronics", "high", 0.89, 30),
    ("Wellness & Mental Health Product Growth", "Health", "high", 0.85, 45),
    ("Smart Home Adoption Accelerating", "Electronics", "high", 0.92, 60),
    ("Premium Athletic Wear Demand Rising", "Sports", "medium", 0.74, 30),
    ("Plant-Based Supplement Market Expanding", "Health", "medium", 0.71, 45),
    ("Work-From-Home Equipment Stabilizing", "Electronics", "low", 0.62, 30),
    ("Budget Beauty Product Gains Traction", "Beauty", "medium", 0.68, 30),
    ("Outdoor Recreation Accessories Boom", "Sports", "high", 0.81, 45),
    ("Pet Product Premium Segment Growing", "Pets", "medium", 0.73, 30),
    ("STEM Toys Demand Rising Among Parents", "Toys", "medium", 0.76, 45),
    ("Resistance Training Equipment Uptick", "Sports", "high", 0.87, 30),
    ("Sleep & Recovery Products Trending", "Health", "high", 0.83, 45),
    ("Minimalist Home Decor Gaining Share", "Home", "medium", 0.69, 30),
    ("Professional Kitchen Tools Demand Up", "Home", "medium", 0.72, 30),
    ("Wearable Technology Mass Adoption", "Electronics", "high", 0.88, 60),
    ("Natural Skincare Category Expanding", "Beauty", "high", 0.84, 45),
    ("Compact Exercise Equipment Trending", "Sports", "medium", 0.77, 30),
    ("Voice-Controlled Smart Devices Growth", "Electronics", "high", 0.91, 60),
    ("Organic Snack Market Accelerating", "Health", "medium", 0.70, 30),
    ("Luxury Pet Care Segment Booming", "Pets", "high", 0.82, 45),
]

INSIGHT_DATA = [
    ("marketing", "high", "Launch Retargeting Campaign for Cart Abandoners",
     "23% of add-to-cart events do not convert. A targeted email retargeting sequence within 2 hours of abandonment could recover an estimated $42,000 in monthly revenue based on current traffic patterns."),
    ("sales", "high", "Cross-Sell Electronics Accessories to Recent Buyers",
     "Customers who purchased Electronics in the last 30 days have a 34% higher conversion rate on accessory products. Bundle promotions could increase average order value by 28%."),
    ("retention", "high", "Reactivate At-Risk Customer Segment",
     "387 customers haven't purchased in 60+ days but were previously high-value. A personalized win-back campaign with a 15% discount could recover 22% of this segment based on historical data."),
    ("marketing", "medium", "Increase Investment in Organic Social for Sports Category",
     "Sports products are driving 3.2x more organic social traffic than paid, yet ad spend allocation is 60% paid. Reallocating 20% of paid budget to content creation could yield 18% higher ROI."),
    ("product", "high", "Expand Premium Headphone SKUs Based on Demand Signal",
     "Noise-cancelling headphones have a 91% sell-through rate with 47 days average inventory. Demand signals suggest expanding to 3 additional SKUs in the $150-$350 range would capture untapped demand."),
    ("sales", "medium", "Implement Tiered Loyalty Program for Premium Segment",
     "Premium customers (top 20%) generate 68% of revenue. A structured loyalty program with exclusive early access and free shipping thresholds could increase purchase frequency by 22%."),
    ("marketing", "medium", "Optimize Email Send Time for Higher Open Rates",
     "Email analytics show a 31% higher open rate when campaigns are sent Tuesday-Thursday between 9-11 AM local time vs. current Monday evening sends. Shift schedule to capture this uplift."),
    ("retention", "medium", "Create Post-Purchase Onboarding Sequence for New Customers",
     "First-time buyers who make a second purchase within 30 days have a 4.7x higher lifetime value. A 3-email onboarding sequence with product tips could increase repeat purchase rate by 19%."),
    ("product", "medium", "Address Negative Reviews for Home Appliances Category",
     "Home appliances have a 2.8-star average feedback rating vs. 4.2 for other categories. Sentiment analysis identifies packaging and instruction clarity as primary pain points."),
    ("sales", "low", "Test Subscription Model for Consumable Health Products",
     "Supplement and vitamin products have an 85-day average repurchase cycle. A subscription offering with 10% savings could convert 15% of repeat buyers and increase predictable revenue."),
    ("marketing", "high", "Capitalize on Weekend Traffic Surge for Flash Sales",
     "Website traffic is 41% higher on weekends with 28% lower conversion rate. Flash sale events on Saturday afternoons could convert this high-intent traffic and drive incremental revenue."),
    ("retention", "low", "Develop Referral Program for Satisfied Customers",
     "Net Promoter Score analysis shows 34% of customers are promoters. A structured referral program offering $20 credit per referral could generate 180+ new customers per month at low CAC."),
    ("product", "high", "Expand Women's Athletic Wear Line",
     "Women's yoga and athletic products have a 94% 5-star rating and sell out 2.3x faster than men's equivalents. Category expansion with 8-12 new SKUs is strongly supported by demand data."),
    ("sales", "high", "Introduce Bundle Pricing for Fitness Equipment",
     "67% of customers who bought a yoga mat also purchased resistance bands within 45 days. Pre-bundled fitness starter packs at a 12% discount could accelerate revenue in the Sports category."),
    ("marketing", "medium", "Geo-Target High-LTV Regions with Premium Campaigns",
     "North America and Europe segments generate 3.1x higher LTV than other regions. Geo-targeted premium campaigns with region-specific messaging could increase high-value customer acquisition by 24%."),
]

AUDIT_ACTIONS = [
    ("user.login", "user", None),
    ("user.logout", "user", None),
    ("user.created", "user", None),
    ("user.role_changed", "user", None),
    ("user.deactivated", "user", None),
    ("dashboard.created", "dashboard", None),
    ("dashboard.updated", "dashboard", None),
    ("dashboard.deleted", "dashboard", None),
    ("data_source.created", "data_source", None),
    ("data_source.updated", "data_source", None),
    ("api_key.created", "api_key", None),
    ("api_key.revoked", "api_key", None),
    ("insight.refreshed", "insight", None),
    ("export.downloaded", "export", None),
    ("settings.updated", "organization", None),
]

NOTIFICATION_CONTENT = [
    ("New High-Priority Insight Available", "A new marketing recommendation has been generated for your top product category.", "insight"),
    ("Trend Alert: Sports Category", "Resistance training equipment demand is trending up 34% week-over-week.", "trend"),
    ("Pipeline Completed", "Your CSV upload has been processed: 1,247 records ingested successfully.", "pipeline"),
    ("Sentiment Alert", "Negative feedback spike detected in Home Appliances. 12 new reviews this week.", "insight"),
    ("Weekly Insights Ready", "Your weekly AI-generated marketing recommendations are now available.", "insight"),
    ("New Trend Detected", "Smart home device adoption is accelerating in your North America segment.", "trend"),
    ("Revenue Milestone", "Your organization crossed $100K in tracked sales this month.", "system"),
    ("Data Sync Complete", "Shopify integration synced 892 new transactions from the last 24 hours.", "pipeline"),
    ("Customer Segment Update", "387 customers have entered the at-risk segment based on recent activity.", "insight"),
    ("New Product Trending", "Wireless headphones are showing 91% sell-through. Consider restocking soon.", "trend"),
]


# ── seeding functions ─────────────────────────────────────────────────────────

async def seed_organization(session: AsyncSession, name: str, slug: str, plan: str) -> Organization:
    org = Organization(id=uid(), name=name, slug=slug, plan=plan, settings={}, is_active=True)
    session.add(org)
    await session.flush()
    return org


async def seed_users(session: AsyncSession, org: Organization) -> list[User]:
    roles_emails = [
        ("admin",    f"admin@{org.slug.split('-')[0]}.com",    f"Alex Admin"),
        ("analyst",  f"analyst@{org.slug.split('-')[0]}.com",  f"Sam Analyst"),
        ("marketer", f"marketer@{org.slug.split('-')[0]}.com", f"Morgan Marketer"),
        ("viewer",   f"viewer@{org.slug.split('-')[0]}.com",   f"Jordan Viewer"),
    ]
    users = []
    for role, email, name in roles_emails:
        u = User(
            id=uid(),
            organization_id=org.id,
            email=email,
            name=name,
            hashed_password=hash_password("password123"),
            role=role,
            is_active=True,
            last_login_at=rand_date(7),
        )
        session.add(u)
        users.append(u)
    await session.flush()
    return users


async def seed_data_sources(session: AsyncSession, org: Organization, admin_user: User) -> None:
    sources = [
        ("Shopify Store", "api_push", "active", {"shop_url": f"https://{org.slug}.myshopify.com", "sync_interval": 3600}),
        ("CSV Sales Upload", "csv_upload", "active", {"delimiter": ",", "encoding": "utf-8"}),
        ("Webhook Events", "webhook", "active", {"endpoint": f"https://api.pulseiq.io/webhooks/{org.id[:8]}", "secret": "whsec_demo"}),
    ]
    for name, stype, status, config in sources:
        ds = DataSource(
            id=uid(),
            organization_id=org.id,
            name=name,
            type=stype,
            status=status,
            config=config,
            last_synced_at=rand_date(1),
        )
        session.add(ds)
    await session.flush()


async def seed_api_keys(session: AsyncSession, org: Organization, admin_user: User) -> None:
    keys = [
        ("Production API Key", ["read:analytics", "read:insights", "read:sentiment"]),
        ("Data Ingestion Key", ["write:ingestion", "read:products", "read:customers"]),
    ]
    for name, scopes in keys:
        raw = f"piq_{uid().replace('-', '')}"
        ak = ApiKey(
            id=uid(),
            organization_id=org.id,
            name=name,
            key_hash=api_key_hash(raw),
            key_prefix=raw[:8],
            scopes=scopes,
            is_active=True,
            created_by=admin_user.id,
            last_used_at=rand_date(3),
        )
        session.add(ak)
    await session.flush()


async def seed_products(session: AsyncSession, org: Organization, catalog_slice: list) -> list[Product]:
    products = []
    for i, (name, category, subcategory, price) in enumerate(catalog_slice):
        p = Product(
            id=uid(),
            organization_id=org.id,
            external_id=f"EXT-PROD-{i+1:04d}",
            name=name,
            category=category,
            subcategory=subcategory,
            price=price,
            currency="USD",
            attributes={"sku": f"SKU-{rng.randint(10000, 99999)}", "weight_kg": round(rng.uniform(0.1, 10.0), 2)},
            is_active=True,
        )
        session.add(p)
        products.append(p)
    await session.flush()
    return products


async def seed_customers(session: AsyncSession, org: Organization, count: int) -> list[Customer]:
    customers = []
    for i in range(count):
        first_seen = rand_date(365, 30)
        last_seen = rand_date(30)
        c = Customer(
            id=uid(),
            organization_id=org.id,
            external_id=f"CUST-{i+1:05d}",
            email_hash=hashlib.sha256(f"customer{i}@example.com".encode()).hexdigest(),
            segment=rng.choice(CUSTOMER_SEGMENTS),
            region=rng.choice(REGIONS),
            attributes={
                "age_group": rng.choice(["18-24", "25-34", "35-44", "45-54", "55+"]),
                "acquisition_channel": rng.choice(["organic", "paid_search", "social", "email", "referral"]),
                "lifetime_orders": rng.randint(1, 48),
            },
            first_seen_at=first_seen,
            last_seen_at=last_seen,
        )
        session.add(c)
        customers.append(c)
    await session.flush()
    return customers


async def seed_sales(session: AsyncSession, org: Organization, products: list[Product], customers: list[Customer], count: int) -> None:
    for i in range(count):
        product = rng.choice(products)
        customer = rng.choice(customers)
        qty = rng.randint(1, 5)
        txn_at = rand_date(365)
        s = SaleData(
            id=uid(),
            organization_id=org.id,
            external_id=f"TXN-{i+1:06d}",
            product_id=product.id,
            customer_id=customer.id,
            amount=round(float(product.price) * qty * rng.uniform(0.85, 1.05), 2),
            currency="USD",
            quantity=qty,
            transaction_at=txn_at,
            ingested_at=txn_at + timedelta(minutes=rng.randint(1, 60)),
            created_at=txn_at,
        )
        session.add(s)
    await session.flush()


async def seed_events(session: AsyncSession, org: Organization, products: list[Product], customers: list[Customer], count: int) -> None:
    for i in range(count):
        product = rng.choice(products) if rng.random() > 0.2 else None
        customer = rng.choice(customers) if rng.random() > 0.15 else None
        etype = rng.choice(EVENT_TYPES)
        occurred = rand_date(90)
        e = ConsumerEvent(
            id=uid(),
            organization_id=org.id,
            external_id=f"EVT-{i+1:07d}",
            customer_id=customer.id if customer else None,
            product_id=product.id if product else None,
            event_type=etype,
            properties={
                "session_id": uid()[:16],
                "page": rng.choice(["/product", "/cart", "/checkout", "/home", "/search"]),
                "device": rng.choice(["mobile", "desktop", "tablet"]),
                "duration_seconds": rng.randint(3, 600) if etype in ("view", "search") else None,
            },
            occurred_at=occurred,
            ingested_at=occurred + timedelta(seconds=rng.randint(1, 30)),
        )
        session.add(e)
    await session.flush()


async def seed_feedback(session: AsyncSession, org: Organization, products: list[Product], customers: list[Customer], count: int) -> list[Feedback]:
    feedbacks = []
    for i in range(count):
        product = rng.choice(products)
        customer = rng.choice(customers) if rng.random() > 0.3 else None
        rating = rng.choices([1, 2, 3, 4, 5], weights=[5, 8, 12, 30, 45])[0]
        if rating >= 4:
            text = rng.choice(POSITIVE_FEEDBACK)
        elif rating == 3:
            text = rng.choice(NEUTRAL_FEEDBACK)
        else:
            text = rng.choice(NEGATIVE_FEEDBACK)
        submitted = rand_date(180)
        f = Feedback(
            id=uid(),
            organization_id=org.id,
            external_id=f"FB-{i+1:05d}",
            customer_id=customer.id if customer else None,
            product_id=product.id,
            text=text,
            rating=rating,
            source=rng.choice(FEEDBACK_SOURCES),
            submitted_at=submitted,
            created_at=submitted,
        )
        session.add(f)
        feedbacks.append(f)
    await session.flush()
    return feedbacks


async def seed_sentiment(session: AsyncSession, org: Organization, feedbacks: list[Feedback]) -> None:
    for fb in feedbacks:
        if fb.rating and fb.rating >= 4:
            sentiment, score = "positive", round(rng.uniform(0.72, 0.99), 3)
        elif fb.rating == 3:
            sentiment, score = "neutral", round(rng.uniform(0.55, 0.75), 3)
        else:
            sentiment, score = "negative", round(rng.uniform(0.65, 0.97), 3)
        sr = SentimentResult(
            id=uid(),
            organization_id=org.id,
            feedback_id=fb.id,
            sentiment=sentiment,
            score=score,
            confidence=round(rng.uniform(0.80, 0.99), 3),
            model_used="gpt-4o-mini",
            analyzed_at=fb.created_at + timedelta(minutes=rng.randint(2, 30)),
        )
        session.add(sr)
    await session.flush()


async def seed_trends(session: AsyncSession, org: Organization) -> list[TrendPrediction]:
    trends = []
    for title, category, signal, confidence, horizon in TREND_DATA:
        gen_at = rand_date(30)
        tp = TrendPrediction(
            id=uid(),
            organization_id=org.id,
            title=title,
            description=(
                f"{title}: Analysis of the last 90 days of consumer behavior, sales velocity, and "
                f"search signal data indicates a {signal}-confidence trend in the {category} category. "
                f"Momentum is supported by a {round(confidence*100)}% confidence signal across "
                f"multiple correlated data sources. Recommended action window: next {horizon} days."
            ),
            category=category,
            confidence=confidence,
            signal_strength=signal,
            supporting_data={
                "search_volume_growth": f"+{rng.randint(12, 67)}%",
                "sales_velocity_change": f"+{rng.randint(8, 44)}%",
                "social_mentions_delta": f"+{rng.randint(15, 89)}%",
                "data_points_analyzed": rng.randint(1200, 18000),
            },
            model_used="gpt-4o",
            horizon_days=horizon,
            generated_at=gen_at,
            expires_at=gen_at + timedelta(days=horizon),
        )
        session.add(tp)
        trends.append(tp)
    await session.flush()
    return trends


async def seed_insights(session: AsyncSession, org: Organization) -> None:
    for itype, priority, title, description in INSIGHT_DATA:
        gen_at = rand_date(14)
        ins = Insight(
            id=uid(),
            organization_id=org.id,
            type=itype,
            priority=priority,
            title=title,
            description=description,
            supporting_data={
                "metric_lift_estimate": f"+{rng.randint(8, 35)}%",
                "affected_customers": rng.randint(150, 4500),
                "revenue_impact_estimate": f"${rng.randint(5000, 120000):,}",
                "confidence_score": round(rng.uniform(0.68, 0.95), 2),
                "data_window_days": rng.choice([7, 14, 30, 90]),
            },
            source_agent=rng.choice(["RecommendationAgent", "BehaviorAnalysisAgent", "TrendPredictionAgent"]),
            model_used="gpt-4o",
            generated_at=gen_at,
            expires_at=gen_at + timedelta(days=rng.choice([7, 14, 30])),
        )
        session.add(ins)
    await session.flush()


async def seed_dashboards(session: AsyncSession, org: Organization, admin_user: User) -> list[Dashboard]:
    dashboards_def = [
        ("Executive Overview", "High-level KPIs for leadership review", True, [
            {"id": uid(), "type": "kpi_card", "title": "Total Revenue", "metric": "revenue", "w": 3, "h": 2, "x": 0, "y": 0},
            {"id": uid(), "type": "kpi_card", "title": "Total Orders", "metric": "orders", "w": 3, "h": 2, "x": 3, "y": 0},
            {"id": uid(), "type": "kpi_card", "title": "Active Customers", "metric": "customers", "w": 3, "h": 2, "x": 6, "y": 0},
            {"id": uid(), "type": "kpi_card", "title": "Avg Order Value", "metric": "aov", "w": 3, "h": 2, "x": 9, "y": 0},
            {"id": uid(), "type": "line_chart", "title": "Revenue Trend (90d)", "metric": "revenue_daily", "w": 8, "h": 4, "x": 0, "y": 2},
            {"id": uid(), "type": "donut_chart", "title": "Revenue by Category", "metric": "revenue_by_category", "w": 4, "h": 4, "x": 8, "y": 2},
        ]),
        ("Marketing Performance", "Campaign, sentiment, and recommendation tracking", False, [
            {"id": uid(), "type": "kpi_card", "title": "Sentiment Score", "metric": "sentiment_positive_pct", "w": 4, "h": 2, "x": 0, "y": 0},
            {"id": uid(), "type": "kpi_card", "title": "Open Insights", "metric": "insights_count", "w": 4, "h": 2, "x": 4, "y": 0},
            {"id": uid(), "type": "kpi_card", "title": "Conversion Rate", "metric": "conversion_rate", "w": 4, "h": 2, "x": 8, "y": 0},
            {"id": uid(), "type": "bar_chart", "title": "Feedback by Product", "metric": "feedback_by_product", "w": 6, "h": 4, "x": 0, "y": 2},
            {"id": uid(), "type": "insight_list", "title": "Top Recommendations", "metric": "top_insights", "w": 6, "h": 4, "x": 6, "y": 2},
        ]),
        ("Analytics Deep Dive", "Funnel, cohort, and behavioral analysis", False, [
            {"id": uid(), "type": "funnel_chart", "title": "Conversion Funnel", "metric": "funnel", "w": 6, "h": 5, "x": 0, "y": 0},
            {"id": uid(), "type": "heatmap", "title": "Activity Heatmap", "metric": "events_heatmap", "w": 6, "h": 5, "x": 6, "y": 0},
            {"id": uid(), "type": "cohort_table", "title": "Cohort Retention", "metric": "cohort_retention", "w": 12, "h": 5, "x": 0, "y": 5},
        ]),
    ]
    dashboards = []
    for name, desc, is_default, widgets in dashboards_def:
        d = Dashboard(
            id=uid(),
            organization_id=org.id,
            created_by=admin_user.id,
            name=name,
            description=desc,
            layout={"cols": 12, "row_height": 80},
            widgets=widgets,
            is_default=is_default,
        )
        session.add(d)
        dashboards.append(d)
    await session.flush()
    return dashboards


async def seed_mobile(session: AsyncSession, org: Organization, users: list[User]) -> None:
    for user in users:
        pref = MobilePreference(
            id=uid(),
            user_id=user.id,
            push_enabled=rng.random() > 0.3,
            notify_on_insights=True,
            notify_on_trends=rng.random() > 0.4,
            notify_on_pipeline=rng.random() > 0.6,
            pwa_installed=rng.random() > 0.5,
        )
        session.add(pref)

        # Notifications for admin and analyst
        if user.role in ("admin", "analyst"):
            notif_pool = rng.sample(NOTIFICATION_CONTENT, min(len(NOTIFICATION_CONTENT), 10))
            for title, body, ntype in notif_pool:
                mn = MobileNotification(
                    id=uid(),
                    organization_id=org.id,
                    user_id=user.id,
                    title=title,
                    body=body,
                    type=ntype,
                    is_read=rng.random() > 0.4,
                    sent_at=rand_date(30),
                    created_at=rand_date(30),
                )
                session.add(mn)
    await session.flush()


async def seed_audit_logs(session: AsyncSession, org: Organization, users: list[User], count: int) -> None:
    for _ in range(count):
        user = rng.choice(users)
        action, entity_type, _ = rng.choice(AUDIT_ACTIONS)
        al = AuditLog(
            id=uid(),
            organization_id=org.id,
            user_id=user.id,
            action=action,
            entity_type=entity_type,
            entity_id=uid() if entity_type else None,
            ip_address=f"{rng.randint(1,254)}.{rng.randint(0,255)}.{rng.randint(0,255)}.{rng.randint(1,254)}",
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            metadata_={"result": "success", "duration_ms": rng.randint(12, 480)},
            occurred_at=rand_date(90),
        )
        session.add(al)
    await session.flush()


# ── main ──────────────────────────────────────────────────────────────────────

async def main() -> None:
    engine = create_async_engine(settings.database_url, echo=False)

    print("[...] Dropping and recreating all tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    print("[OK]  Tables created.")

    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        # ── Org 1: Demo Corp ──────────────────────────────────────────────────
        print("[...] Seeding Demo Corp...")
        org1 = await seed_organization(session, "Demo Corp", "democorp", "enterprise")
        users1 = await seed_users(session, org1)
        await session.commit()

        # Fix email for org1 admin to the canonical test login
        users1[0].email = "admin@democorp.com"
        await session.commit()

        await seed_data_sources(session, org1, users1[0])
        await seed_api_keys(session, org1, users1[0])
        products1 = await seed_products(session, org1, PRODUCT_CATALOG[:30])
        customers1 = await seed_customers(session, org1, 200)
        await session.commit()

        await seed_sales(session, org1, products1, customers1, 2000)
        await session.commit()

        await seed_events(session, org1, products1, customers1, 4000)
        await session.commit()

        feedbacks1 = await seed_feedback(session, org1, products1, customers1, 300)
        await session.commit()

        await seed_sentiment(session, org1, feedbacks1)
        await seed_trends(session, org1)
        await seed_insights(session, org1)
        await seed_dashboards(session, org1, users1[0])
        await seed_mobile(session, org1, users1)
        await seed_audit_logs(session, org1, users1, 150)
        await session.commit()
        print("[OK] Demo Corp seeded.")

        # ── Org 2: RetailPlus ─────────────────────────────────────────────────
        print("[...] Seeding RetailPlus...")
        org2 = await seed_organization(session, "RetailPlus", "retailplus", "growth")
        users2 = await seed_users(session, org2)
        await session.commit()

        await seed_data_sources(session, org2, users2[0])
        await seed_api_keys(session, org2, users2[0])
        products2 = await seed_products(session, org2, PRODUCT_CATALOG[20:])
        customers2 = await seed_customers(session, org2, 150)
        await session.commit()

        await seed_sales(session, org2, products2, customers2, 1500)
        await session.commit()

        await seed_events(session, org2, products2, customers2, 3000)
        await session.commit()

        feedbacks2 = await seed_feedback(session, org2, products2, customers2, 200)
        await session.commit()

        await seed_sentiment(session, org2, feedbacks2)
        await seed_trends(session, org2)
        await seed_insights(session, org2)
        await seed_dashboards(session, org2, users2[0])
        await seed_mobile(session, org2, users2)
        await seed_audit_logs(session, org2, users2, 100)
        await session.commit()
        print("[OK] RetailPlus seeded.")

    await engine.dispose()

    print("\n[DONE] Seed complete. Summary:")
    print("   Orgs        : 2  (Demo Corp, RetailPlus)")
    print("   Users       : 8  (admin/analyst/marketer/viewer per org)")
    print("   Products    : ~50")
    print("   Customers   : 350")
    print("   Sales       : 3,500")
    print("   Events      : 7,000")
    print("   Feedback    : 500")
    print("   Sentiment   : 500")
    print("   Trends      : 40")
    print("   Insights    : 30")
    print("   Dashboards  : 6")
    print("   Audit Logs  : 250+")
    print("\n   Login: admin@democorp.com / password123")


if __name__ == "__main__":
    asyncio.run(main())
