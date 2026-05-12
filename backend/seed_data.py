"""
UK Banking & Fintech demo data seed â€” populates all tables with realistic
data so every dashboard, chart, and AI feature has something to show.
Run once: python seed_data.py
"""
import asyncio
import random
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import text
from core.database import AsyncSessionLocal
from core.security import hash_password

# â”€â”€ Import all models â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import models  # registers all models including new ones  # noqa: F401
from models.organization import Organization
from models.user import User
from models.customer import Customer
from models.product import Product
from models.sales import SaleData
from models.event import ConsumerEvent
from models.feedback import Feedback
from models.sentiment import SentimentResult
from models.insight import Insight
from models.trend import TrendPrediction
from models.financial_product import FinancialProduct
from models.product_holding import ProductHolding
from models.kyc_session import KycSession
from models.compliance_signal import ComplianceSignal

# â”€â”€ Config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
DEMO_ORG_SLUG = "democorp"
NOW = datetime.now(timezone.utc)
rng = random.Random(42)   # deterministic so re-runs don't duplicate


def uid() -> str:
    return str(uuid.uuid4())


def days_ago(n: float) -> datetime:
    return NOW - timedelta(days=n)


def rand_dt(days_back_min: float, days_back_max: float) -> datetime:
    offset = rng.uniform(days_back_min, days_back_max)
    return NOW - timedelta(days=offset)


# â”€â”€ Products (financial products in the `products` catalog table) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
UK_PRODUCTS = [
    ("Current Account", "current_account", 0.0),
    ("Savings ISA", "savings_account", 3.5),
    ("Personal Loan", "personal_loan", 8.9),
    ("Credit Card", "credit_card", 22.9),
    ("Mortgage (2yr Fix)", "mortgage", 4.75),
    ("Premium Current Account", "current_account", 0.0),
    ("Fixed-Rate Bond 1yr", "fixed_deposit", 5.2),
    ("Business Account", "current_account", 0.0),
]

UK_SEGMENTS = [
    "Young Professionals", "Families", "First-Time Buyers",
    "SME Owners", "High Net Worth", "Students", "Near-Retirement",
]

UK_REGIONS = [
    "London", "Manchester", "Birmingham", "Edinburgh",
    "Bristol", "Leeds", "Liverpool", "Glasgow",
]

FEEDBACK_TEXTS = [
    # Positive
    ("The new mobile app is excellent â€” Open Banking integration saved me hours.", "positive", 5, "app"),
    ("KYC was painless, completed in under 3 minutes. Very impressed.", "positive", 5, "app"),
    ("Transferred my mortgage and the adviser was brilliant.", "positive", 4, "branch"),
    ("Interest rate on the ISA is the best on the market right now.", "positive", 5, "nps_survey"),
    ("Direct debit setup couldn't be easier. Great UX.", "positive", 4, "app"),
    ("Customer service resolved my query instantly over chat.", "positive", 5, "chatbot"),
    ("Really happy with my personal loan approval time â€” same day!", "positive", 5, "nps_survey"),
    ("The app alerts for payments are super helpful.", "positive", 4, "app"),
    ("Fixed-rate bond offering is better than any high street bank.", "positive", 5, "nps_survey"),
    ("Standing order set up in seconds. Brilliant.", "positive", 4, "app"),
    ("Switching was incredibly smooth â€” thanks to the team.", "positive", 5, "branch"),
    ("Best digital banking experience I've had.", "positive", 5, "app"),
    ("The financial wellness dashboard is a game changer.", "positive", 4, "app"),
    ("Credit card cashback is generous.", "positive", 4, "nps_survey"),
    ("Contactless limits raised without any hassle.", "positive", 5, "app"),
    # Neutral
    ("App is fine but could do with more chart options in spending insights.", "neutral", 3, "app"),
    ("Transfer times are standard â€” nothing special but reliable.", "neutral", 3, "app"),
    ("Branch wait was 15 minutes but staff were helpful once I got there.", "neutral", 3, "branch"),
    ("Interest rate is competitive but not the highest available.", "neutral", 3, "nps_survey"),
    ("Mortgage process took longer than expected â€” 6 weeks.", "neutral", 3, "branch"),
    ("App works fine, just basic compared to some fintechs.", "neutral", 3, "app"),
    ("Customer support response time is acceptable.", "neutral", 3, "call_centre"),
    ("Decent account overall, nothing extraordinary.", "neutral", 3, "survey"),
    # Negative
    ("KYC failed twice despite uploading a valid passport. Very frustrating.", "negative", 1, "app"),
    ("Direct debit was cancelled without notification â€” caused a missed payment.", "negative", 2, "call_centre"),
    ("Loan application rejected with no explanation given.", "negative", 1, "app"),
    ("App crashed during a payment â€” had to call the branch.", "negative", 2, "app"),
    ("Card was declined abroad despite travel notification being set.", "negative", 1, "call_centre"),
    ("Waited 40 minutes on hold before giving up.", "negative", 1, "call_centre"),
    ("Branch closed without warning â€” had to travel 10 miles.", "negative", 2, "branch"),
    ("Interest charged incorrectly on my credit card statement.", "negative", 2, "nps_survey"),
]

INSIGHT_DATA = [
    ("churn_prevention", "high",
     "High churn risk in Near-Retirement segment",
     "23% of Near-Retirement customers show declining login frequency and increased call-centre contacts "
     "over the past 30 days. Recommend proactive outreach with personalised financial review offers "
     "before end-of-quarter rate reviews.",
     {"at_risk_pct": 23.1, "signals": ["login_decline", "call_centre_spike"], "confidence": 0.84}),

    ("cross_sell", "high",
     "ISA cross-sell opportunity: Current Account holders",
     "4,200 customers hold only a current account and have salary credits above Â£2,500/month. "
     "42% show savings behaviour (low spend/income ratio). Propensity score: 0.71. "
     "Recommended angle: 'Protect your savings from inflation with a tax-free ISA.'",
     {"propensity_score": 0.71, "eligible_customers": 4200, "segment": "Young Professionals"}),

    ("cross_sell", "medium",
     "Personal loan cross-sell: First-Time Buyers",
     "1,800 customers with mortgages applied in the last 6 months show home improvement search patterns. "
     "Propensity score: 0.58 for home improvement personal loans. Consider targeted in-app campaign.",
     {"propensity_score": 0.58, "eligible_customers": 1800, "product": "Personal Loan"}),

    ("product_acquisition", "high",
     "Premium Current Account upgrade campaign ready",
     "6,500 standard current account holders have held their account for 12+ months and transact above "
     "the product threshold. 38% qualify for Premium based on balance criteria. Expected uplift: Â£18/month per customer.",
     {"qualifying_customers": 6500, "upgrade_rate_est": 0.38, "monthly_revenue_uplift": 18}),

    ("churn_prevention", "medium",
     "Student segment activation gap â€” 60-day dormancy spike",
     "31% of Student segment accounts dormant for 60+ days, up from 18% last quarter. "
     "Likely cause: semester end. Recommend push notification campaign with budgeting tips and ISA awareness.",
     {"dormant_pct": 31, "prev_dormant_pct": 18, "segment": "Students"}),

    ("product_acquisition", "medium",
     "Fixed-Rate Bond launch timing aligned with market signals",
     "Customer NPS scores for savings products are at a 6-month high (62). "
     "With Bank of England base rate expected to fall, now is optimal timing for Fixed-Rate Bond push. "
     "Target: customers with Â£5k+ in standard savings account.",
     {"nps_savings": 62, "target_balance_threshold_gbp": 5000}),

    ("feature_adoption", "low",
     "Open Banking consent low among SME Owners",
     "Only 12% of SME Owner segment have granted Open Banking consent vs 34% platform average. "
     "Frictionless onboarding flow for business account holders could increase consent rates "
     "and unlock cash flow forecasting features.",
     {"consent_rate_sme": 0.12, "platform_avg": 0.34, "segment": "SME Owners"}),

    ("retention", "high",
     "Mortgage renewal window: 2,100 customers due in 90 days",
     "2,100 mortgage customers are within 90 days of their fixed-rate period ending. "
     "Proactive retention outreach needed â€” competitor rates are currently 0.15% lower. "
     "Historical retention rate when contacted early: 78%.",
     {"customers_due": 2100, "days_to_expiry": 90, "early_contact_retention_rate": 0.78}),

    ("conversion_optimization", "medium",
     "KYC abandonment at document upload step: 28% drop-off",
     "28% of KYC sessions that reach the document upload step do not complete. "
     "User research suggests PDF uploads failing silently on mobile. "
     "Engineering fix + progress indicator addition estimated to recover 40% of drop-offs.",
     {"drop_off_pct": 28, "step": "document_upload", "est_recovery_pct": 40}),

    ("churn_prevention", "high",
     "Failed payment cluster in Families segment",
     "147 customers in the Families segment had 3+ failed payments in the last 14 days. "
     "FCA Consumer Duty obligations require proactive support outreach. "
     "Recommend financial difficulty check-in and payment plan offer.",
     {"customers_affected": 147, "avg_failed_payments": 3.8, "regulatory_flag": "FCA Consumer Duty"}),

    ("product_roadmap_signal", "low",
     "BNPL demand signal from 18-25 age bracket",
     "Search terms associated with BNPL products appear in 8% of in-app help queries from 18-25 segment. "
     "Sentiment around current credit card offering is neutral-to-negative in this cohort. "
     "Consider BNPL product scoping for H2 roadmap.",
     {"query_share": 0.08, "segment": "Students", "sentiment": "neutral"}),

    ("cross_sell", "medium",
     "Business Account holders: merchant payment gateway upsell",
     "560 business account holders processing >Â£10k/month are not using the integrated payment gateway. "
     "Average revenue uplift per merchant customer: Â£45/month.",
     {"eligible_merchants": 560, "monthly_revenue_uplift": 45}),
]

TREND_DATA = [
    ("Rising demand for embedded finance in SME lending",
     "Open Banking data shows a 34% increase in SME customers connecting third-party accounting tools. "
     "Market signals indicate growing appetite for embedded lending decisions at the point of invoice "
     "rather than traditional branch-based applications. Fintech challengers Tide and Starling are "
     "capturing this segment aggressively.",
     "SME Banking", 0.82, "high", 90),

    ("Fixed-rate mortgage churn risk rising ahead of BOE review",
     "Competitor comparison tool usage has increased 67% among mortgage customers in the last 21 days. "
     "Rate comparison sites show DemoCorp's 2yr fix is now 0.12% above nearest competitor. "
     "Historical pattern: rate sensitivity spikes 8-12 weeks before Bank of England MPC meetings.",
     "Mortgages", 0.76, "high", 60),

    ("Digital-first onboarding becoming table stakes for 18-30 demographic",
     "Event data shows 91% of customers aged 18-30 start their account opening journey on mobile. "
     "Average KYC completion time benchmark across UK challengers: 4.2 minutes. "
     "Current platform average: 8.7 minutes. Risk of losing this cohort to challenger banks.",
     "Digital Onboarding", 0.88, "high", 45),

    ("ISA season uplift: March deadline driving search intent",
     "Keyword monitoring shows a 3x increase in ISA-related queries from existing customers. "
     "Year-end ISA allowance deadline (5 April) creates annual window. "
     "Customers with Â£3k+ in savings account are prime conversion targets.",
     "Savings Products", 0.79, "medium", 30),

    ("Contactless payment limits: customer expectation shift",
     "Post-pandemic behaviour has permanently elevated contactless usage. "
     "45% of payment complaints now relate to declined contactless transactions above Â£100. "
     "Competitors are moving to biometric-authenticated unlimited contactless. "
     "Signal suggests product gap forming.",
     "Payments", 0.71, "medium", 75),

    ("Vulnerable customer regulatory scrutiny intensifying",
     "FCA Consumer Duty guidance updates in Q4 have increased compliance team workload sector-wide. "
     "PulsIQ sentiment data shows 11% spike in negative feedback mentioning 'support' and 'help' "
     "from customers aged 65+. Early indicator of potential Consumer Duty exposure.",
     "Regulatory / Compliance", 0.65, "medium", 120),

    ("Credit card reward programmes: low engagement among high spenders",
     "Transaction data shows 34% of customers spending >Â£2,000/month on credit card "
     "have never redeemed a reward. Competitor challenger cards offering cashback seeing "
     "net promoter improvements. Engagement gap is a churn risk vector.",
     "Credit Cards", 0.68, "low", 60),
]


async def get_org_id(session) -> str | None:
    r = await session.execute(
        text("SELECT id FROM organizations WHERE slug = :slug"),
        {"slug": DEMO_ORG_SLUG},
    )
    return r.scalar_one_or_none()


async def seed():
    async with AsyncSessionLocal() as session:
        org_id = await get_org_id(session)
        if not org_id:
            print("ERROR: Demo org not found. Run seed_demo.py first.")
            return

        print(f"Seeding for org {org_id}...")

        # â”€â”€ Products â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        print("  â†’ Products...")
        product_ids = []
        for i, (name, category, price) in enumerate(UK_PRODUCTS):
            ext_id = f"prod-{i+1:03d}"
            existing = await session.execute(
                text("SELECT id FROM products WHERE organization_id=:o AND external_id=:e"),
                {"o": org_id, "e": ext_id},
            )
            pid = existing.scalar_one_or_none()
            if not pid:
                p = Product(
                    organization_id=org_id,
                    external_id=ext_id,
                    name=name,
                    category=category,
                    price=price,
                    currency="GBP",
                )
                session.add(p)
                await session.flush()
                pid = p.id
            product_ids.append(pid)
        await session.commit()
        print(f"    {len(product_ids)} products ready.")

        # â”€â”€ Customers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        print("  â†’ Customers...")
        customer_ids = []
        for i in range(120):
            ext_id = f"cust-{i+1:04d}"
            existing = await session.execute(
                text("SELECT id FROM customers WHERE organization_id=:o AND external_id=:e"),
                {"o": org_id, "e": ext_id},
            )
            cid = existing.scalar_one_or_none()
            if not cid:
                c = Customer(
                    organization_id=org_id,
                    external_id=ext_id,
                    segment=rng.choice(UK_SEGMENTS),
                    region=rng.choice(UK_REGIONS),
                    first_seen_at=rand_dt(180, 365),
                    last_seen_at=rand_dt(0, 14),
                )
                session.add(c)
                await session.flush()
                cid = c.id
            customer_ids.append(cid)
        await session.commit()
        print(f"    {len(customer_ids)} customers ready.")

        # â”€â”€ Consumer Events â€” financial funnel â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        print("  â†’ Consumer events...")
        existing_events = await session.execute(
            text("SELECT COUNT(*) FROM consumer_events WHERE organization_id=:o"), {"o": org_id}
        )
        if existing_events.scalar_one() == 0:
            events = []
            # Funnel events (retail banking) â€” spread over 45 days
            for cid in rng.sample(customer_ids, 100):
                t = rand_dt(5, 45)
                events.append(ConsumerEvent(
                    organization_id=org_id, customer_id=cid,
                    event_type="onboarding_started", properties={"channel": "mobile"},
                    occurred_at=t, ingested_at=t,
                ))
            for cid in rng.sample(customer_ids, 90):
                t = rand_dt(4, 44)
                events.append(ConsumerEvent(
                    organization_id=org_id, customer_id=cid,
                    event_type="kyc_initiated", properties={"provider": "Onfido"},
                    occurred_at=t, ingested_at=t,
                ))
                events.append(ConsumerEvent(
                    organization_id=org_id, customer_id=cid,
                    event_type="kyc_document_uploaded",
                    properties={"document_type": rng.choice(["passport", "driving_licence"])},
                    occurred_at=t + timedelta(minutes=rng.randint(2, 8)), ingested_at=t,
                ))
            for cid in rng.sample(customer_ids, 74):
                t = rand_dt(3, 43)
                events.append(ConsumerEvent(
                    organization_id=org_id, customer_id=cid,
                    event_type="kyc_completed", properties={"duration_seconds": rng.randint(180, 520)},
                    occurred_at=t, ingested_at=t,
                ))
            for cid in rng.sample(customer_ids, 16):
                t = rand_dt(3, 40)
                events.append(ConsumerEvent(
                    organization_id=org_id, customer_id=cid,
                    event_type="kyc_failed",
                    properties={"reason": rng.choice(["document_blur", "face_mismatch", "expired_doc"])},
                    occurred_at=t, ingested_at=t,
                ))
            for cid in rng.sample(customer_ids, 68):
                t = rand_dt(1, 40)
                events.append(ConsumerEvent(
                    organization_id=org_id, customer_id=cid,
                    event_type="account_opened",
                    properties={"product": rng.choice(["Current Account", "Savings ISA"])},
                    occurred_at=t, ingested_at=t,
                ))
            # Payment events
            for _ in range(400):
                cid = rng.choice(customer_ids)
                t = rand_dt(0, 30)
                outcome = rng.choices(
                    ["payment_completed", "payment_failed", "payment_initiated"],
                    weights=[75, 10, 15],
                )[0]
                events.append(ConsumerEvent(
                    organization_id=org_id, customer_id=cid,
                    event_type=outcome,
                    properties={"amount_gbp": round(rng.uniform(5, 2000), 2),
                                "channel": rng.choice(["mobile", "online", "branch"])},
                    occurred_at=t, ingested_at=t,
                ))
            # Logins
            for _ in range(350):
                cid = rng.choice(customer_ids)
                t = rand_dt(0, 30)
                events.append(ConsumerEvent(
                    organization_id=org_id, customer_id=cid,
                    event_type="login", properties={"channel": "mobile"},
                    occurred_at=t, ingested_at=t,
                ))
            # Other activity
            misc_types = [
                "transfer_completed", "beneficiary_added", "direct_debit_setup",
                "standing_order_created", "open_banking_consent_given",
                "loan_application_started", "loan_application_completed",
                "card_activated", "branch_visit", "call_centre_contact",
            ]
            for _ in range(300):
                cid = rng.choice(customer_ids)
                t = rand_dt(0, 45)
                events.append(ConsumerEvent(
                    organization_id=org_id, customer_id=cid,
                    event_type=rng.choice(misc_types), properties={},
                    occurred_at=t, ingested_at=t,
                ))
            session.add_all(events)
            await session.commit()
            print(f"    {len(events)} events inserted.")
        else:
            print("    Events already exist â€” skipping.")

        # â”€â”€ Sales Data (GBP transactions) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        print("  â†’ Sales / transactions...")
        existing_sales = await session.execute(
            text("SELECT COUNT(*) FROM sales_data WHERE organization_id=:o"), {"o": org_id}
        )
        if existing_sales.scalar_one() == 0:
            sales = []
            for i in range(500):
                pid = rng.choice(product_ids)
                cid = rng.choice(customer_ids)
                t = rand_dt(0, 60)
                amount = rng.choices(
                    [rng.uniform(50, 500), rng.uniform(500, 5000), rng.uniform(5000, 50000)],
                    weights=[70, 25, 5],
                )[0]
                sales.append(SaleData(
                    organization_id=org_id,
                    external_id=f"txn-{i+1:05d}",
                    product_id=pid,
                    customer_id=cid,
                    amount=round(amount, 2),
                    currency="GBP",
                    quantity=1,
                    transaction_at=t,
                    ingested_at=t,
                    created_at=t,
                ))
            session.add_all(sales)
            await session.commit()
            print(f"    {len(sales)} transactions inserted.")
        else:
            print("    Sales already exist â€” skipping.")

        # â”€â”€ Feedback â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        print("  â†’ Feedback & sentiment...")
        existing_fb = await session.execute(
            text("SELECT COUNT(*) FROM feedback WHERE organization_id=:o"), {"o": org_id}
        )
        if existing_fb.scalar_one() == 0:
            for i, (text_body, sentiment, rating, source) in enumerate(FEEDBACK_TEXTS * 2):
                cid = rng.choice(customer_ids)
                pid = rng.choice(product_ids)
                t = rand_dt(0, 60)
                fb = Feedback(
                    organization_id=org_id,
                    external_id=f"fb-{i+1:04d}",
                    customer_id=cid,
                    product_id=pid,
                    text=text_body,
                    rating=rating,
                    source=source,
                    submitted_at=t,
                    created_at=t,
                )
                session.add(fb)
                await session.flush()
                score_map = {"positive": rng.uniform(0.7, 0.98),
                             "neutral": rng.uniform(0.35, 0.65),
                             "negative": rng.uniform(0.02, 0.3)}
                sr = SentimentResult(
                    organization_id=org_id,
                    feedback_id=fb.id,
                    sentiment=sentiment,
                    score=round(score_map[sentiment], 3),
                    confidence=round(rng.uniform(0.78, 0.99), 3),
                    model_used="gpt-4o-mini",
                    analyzed_at=t,
                )
                session.add(sr)
            await session.commit()
            print(f"    {len(FEEDBACK_TEXTS) * 2} feedback + sentiment records inserted.")
        else:
            print("    Feedback already exists â€” skipping.")

        # â”€â”€ Insights â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        print("  â†’ Insights...")
        existing_ins = await session.execute(
            text("SELECT COUNT(*) FROM insights WHERE organization_id=:o"), {"o": org_id}
        )
        if existing_ins.scalar_one() == 0:
            agents = {
                "churn_prevention": "churn_prediction_agent",
                "cross_sell": "cross_sell_intelligence_agent",
                "product_acquisition": "product_affinity_agent",
                "feature_adoption": "engagement_scoring_agent",
                "retention": "recommendation_agent",
                "conversion_optimization": "journey_abandonment_agent",
                "product_roadmap_signal": "trend_prediction_agent",
            }
            for insight_type, priority, title, description, supporting_data in INSIGHT_DATA:
                t = rand_dt(0, 14)
                session.add(Insight(
                    organization_id=org_id,
                    type=insight_type,
                    priority=priority,
                    title=title,
                    description=description,
                    supporting_data=supporting_data,
                    source_agent=agents.get(insight_type, "recommendation_agent"),
                    model_used="gpt-4o",
                    generated_at=t,
                ))
            await session.commit()
            print(f"    {len(INSIGHT_DATA)} insights inserted.")
        else:
            print("    Insights already exist â€” skipping.")

        # â”€â”€ Trend Predictions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        print("  â†’ Trend predictions...")
        existing_tr = await session.execute(
            text("SELECT COUNT(*) FROM trend_predictions WHERE organization_id=:o"), {"o": org_id}
        )
        if existing_tr.scalar_one() == 0:
            for title, description, category, confidence, strength, horizon in TREND_DATA:
                t = rand_dt(0, 7)
                session.add(TrendPrediction(
                    organization_id=org_id,
                    title=title,
                    description=description,
                    category=category,
                    confidence=confidence,
                    signal_strength=strength,
                    supporting_data={},
                    model_used="gpt-4o",
                    horizon_days=horizon,
                    generated_at=t,
                ))
            await session.commit()
            print(f"    {len(TREND_DATA)} trends inserted.")
        else:
            print("    Trends already exist â€” skipping.")

        # -- Financial Products --------------------------------------------------
        print("  -> Financial Products...")
        existing_fp = await session.execute(
            text("SELECT COUNT(*) FROM financial_products WHERE organization_id=:o"), {"o": org_id}
        )
        if existing_fp.scalar_one() == 0:
            FIN_PRODUCTS = [
                ("fp-001", "Current Account",          "current_account", 0.0,  None, None,  None),
                ("fp-002", "Savings ISA",               "isa",             3.5,  None, None,  None),
                ("fp-003", "Personal Loan",             "personal_loan",   8.9,  9.9,  None,  60),
                ("fp-004", "Credit Card",               "credit_card",     22.9, 29.9, 5000,  None),
                ("fp-005", "Mortgage (2yr Fix)",        "mortgage",        4.75, 5.1,  None,  300),
                ("fp-006", "Premium Current Account",   "current_account", 0.0,  None, None,  None),
                ("fp-007", "Fixed-Rate Bond 1yr",       "fixed_deposit",   5.2,  None, None,  12),
                ("fp-008", "Business Account",          "business_account",0.0,  None, None,  None),
            ]
            fp_ids = {}
            for ext_id, name, ptype, rate, apr, limit_gbp, term in FIN_PRODUCTS:
                t = rand_dt(180, 730)
                fp = FinancialProduct(
                    organization_id=org_id,
                    external_id=ext_id,
                    name=name,
                    product_type=ptype,
                    interest_rate_pct=rate,
                    apr_pct=apr,
                    credit_limit_gbp=limit_gbp,
                    term_months=term,
                    is_active=True,
                    created_at=t,
                    updated_at=t,
                )
                session.add(fp)
                await session.flush()
                fp_ids[ext_id] = fp.id
            await session.commit()
            print(f"    {len(FIN_PRODUCTS)} financial products inserted.")
        else:
            print("    Financial products already exist -- skipping.")
            rows = await session.execute(
                text("SELECT external_id, id FROM financial_products WHERE organization_id=:o"), {"o": org_id}
            )
            fp_ids = {r.external_id: r.id for r in rows}

        # -- Product Holdings ----------------------------------------------------
        print("  -> Product Holdings...")
        existing_ph = await session.execute(
            text("SELECT COUNT(*) FROM product_holdings WHERE organization_id=:o"), {"o": org_id}
        )
        if existing_ph.scalar_one() == 0:
            holding_count = 0
            for cid in customer_ids:
                assignments = [("fp-001", 1.0)]  # everyone gets a current account
                if rng.random() < 0.40: assignments.append(("fp-002", 1.0))
                if rng.random() < 0.20: assignments.append(("fp-004", 1.0))
                if rng.random() < 0.15: assignments.append(("fp-003", 1.0))
                if rng.random() < 0.10: assignments.append(("fp-005", 1.0))
                if rng.random() < 0.05: assignments.append(("fp-006", 1.0))
                if rng.random() < 0.05: assignments.append(("fp-007", 1.0))
                for ext_id, _ in assignments:
                    if ext_id not in fp_ids:
                        continue
                    opened = rand_dt(90, 730)
                    session.add(ProductHolding(
                        organization_id=org_id,
                        customer_id=cid,
                        financial_product_id=fp_ids[ext_id],
                        status="active",
                        opened_at=opened,
                        created_at=opened,
                        updated_at=opened,
                    ))
                    holding_count += 1
            await session.commit()
            print(f"    {holding_count} product holdings inserted.")
        else:
            print("    Product holdings already exist -- skipping.")

        # -- KYC Sessions --------------------------------------------------------
        print("  -> KYC Sessions...")
        existing_kyc = await session.execute(
            text("SELECT COUNT(*) FROM kyc_sessions WHERE organization_id=:o"), {"o": org_id}
        )
        if existing_kyc.scalar_one() == 0:
            doc_types   = ["passport"] * 5 + ["driving_licence"] * 3 + ["national_id"] + ["utility_bill"]
            drop_steps  = (["document_upload"] * 4 + ["liveness_check"] * 2 +
                           ["address_verification"] * 2 + ["personal_details"])
            statuses = (["completed"] * 72 + ["abandoned"] * 36 +
                        ["failed"] * 18 + ["expired"] * 12 + ["in_progress"] * 12)
            rng.shuffle(statuses)

            kyc_count = 0
            for i, status in enumerate(statuses):
                cid = customer_ids[i % len(customer_ids)]
                initiated = rand_dt(30, 180)
                attempt   = 2 if rng.random() < 0.20 else 1
                doc_type  = rng.choice(doc_types)

                if status == "completed":
                    duration   = rng.randint(180, 600)
                    completed  = initiated + timedelta(seconds=duration)
                    drop_step  = None
                    fail_reason = None
                    fail_code   = None
                elif status == "abandoned":
                    duration   = rng.randint(30, 180)
                    completed  = None
                    drop_step  = rng.choice(drop_steps)
                    fail_reason = None
                    fail_code   = None
                elif status == "failed":
                    duration   = rng.randint(60, 300)
                    completed  = None
                    drop_step  = None
                    fail_reason = rng.choice([
                        "Document image quality too low",
                        "Liveness check failed - face not detected",
                        "Name mismatch between documents",
                        "Address not verifiable against HMRC records",
                    ])
                    fail_code = rng.choice(["IMG_QUALITY", "LIVENESS_FAIL", "NAME_MISMATCH", "ADDR_FAIL"])
                else:  # expired / in_progress
                    duration   = rng.randint(60, 240) if status == "expired" else None
                    completed  = None
                    drop_step  = None
                    fail_reason = "Session expired after 30 minutes" if status == "expired" else None
                    fail_code   = "SESSION_TIMEOUT" if status == "expired" else None

                session.add(KycSession(
                    organization_id=org_id,
                    customer_id=cid,
                    external_session_id=f"onfido-{uid()[:8]}",
                    status=status,
                    document_type=doc_type,
                    attempt_number=attempt,
                    failure_reason=fail_reason,
                    failure_code=fail_code,
                    duration_seconds=duration,
                    drop_off_step=drop_step,
                    provider="Onfido",
                    initiated_at=initiated,
                    completed_at=completed,
                    created_at=initiated,
                ))
                kyc_count += 1
            await session.commit()
            print(f"    {kyc_count} KYC sessions inserted.")
        else:
            print("    KYC sessions already exist -- skipping.")

        # -- Compliance Signals --------------------------------------------------
        print("  -> Compliance Signals...")
        existing_cs = await session.execute(
            text("SELECT COUNT(*) FROM compliance_signals WHERE organization_id=:o"), {"o": org_id}
        )
        if existing_cs.scalar_one() == 0:
            COMPLIANCE_DATA = [
                (
                    "vulnerable_customer_cluster", "high",
                    "147 customers in the Families segment have had 3+ failed payments in the last 14 days. "
                    "Behavioural indicators (repeated call-centre contacts, negative NPS responses) suggest "
                    "financial difficulty. FCA Consumer Duty requires proactive support outreach.",
                    "500-700 customers",
                    "Initiate outreach programme within 5 business days. Offer payment plan and signpost to "
                    "debt advice services. Document all contacts for FCA audit trail.",
                    "FCA Consumer Duty - Outcome 4",
                ),
                (
                    "complaint_spike", "medium",
                    "Complaint volume increased 34% month-on-month, primarily relating to branch closure "
                    "announcements and online banking downtime. Two complaints reference potential mis-selling "
                    "of fixed-rate bond products.",
                    "~320 complaints in 30 days",
                    "Review complaints handling queue. Escalate mis-selling complaints to compliance team "
                    "for root cause analysis within 48 hours.",
                    "FCA DISP 1.3",
                ),
                (
                    "poor_outcome_indicator", "high",
                    "KYC abandonment rate at document upload step is 28%, above the 15% sector benchmark. "
                    "Silent PDF upload failures on mobile devices are likely causing customers to abandon "
                    "account opening, disproportionately affecting the 18-25 demographic.",
                    "~400 affected applicants/month",
                    "Engineering fix for PDF mobile upload required within sprint. Add progress indicator "
                    "and retry mechanism. Re-engage abandoned applicants via email within 72 hours.",
                    "FCA Consumer Duty - PRIN 12",
                ),
                (
                    "consumer_duty_alert", "medium",
                    "Credit card reward redemption rate is 3% among customers spending above 2000 GBP/month. "
                    "Low engagement with a product benefit customers are paying for may constitute a poor "
                    "value outcome under Consumer Duty.",
                    "~1,200 high-spend cardholders",
                    "Launch proactive reward awareness campaign. Simplify redemption journey. Review product "
                    "value proposition against Consumer Duty value assessment framework.",
                    "FCA Consumer Duty - Outcome 2",
                ),
                (
                    "tcf_breach_signal", "low",
                    "Sentiment analysis of customers aged 65+ shows an 11% spike in negative feedback "
                    "mentioning 'support' and 'difficulty' over the past 60 days, coinciding with the "
                    "online banking interface update. Possible accessibility barrier.",
                    "~180 customers aged 65+",
                    "Conduct accessibility audit of updated online banking interface against WCAG 2.1 AA. "
                    "Consider dedicated support pathway for older customers during transition period.",
                    "FCA PRIN 6 - Treating Customers Fairly",
                ),
            ]
            for sig_type, severity, description, population, action, reg_ref in COMPLIANCE_DATA:
                t = rand_dt(0, 30)
                session.add(ComplianceSignal(
                    organization_id=org_id,
                    signal_type=sig_type,
                    severity=severity,
                    description=description,
                    affected_population_estimate=population,
                    recommended_review_action=action,
                    regulatory_reference=reg_ref,
                    supporting_data={},
                    model_used="gpt-4o",
                    reviewed=False,
                    generated_at=t,
                ))
            await session.commit()
            print(f"    {len(COMPLIANCE_DATA)} compliance signals inserted.")
        else:
            print("    Compliance signals already exist -- skipping.")

    print("\nSeed complete. Open http://localhost:3000 and log in.")


if __name__ == "__main__":
    asyncio.run(seed())

