"""
ComplianceSignalAgent — surfaces UK regulatory risk signals for the compliance team.
Covers: FCA Consumer Duty, Treating Customers Fairly (TCF), vulnerable customer guidelines (FG21/1), PSD2.
Does NOT make compliance decisions — raises signals only.
Runs on a weekly schedule, not every ingestion.
"""
from typing import Any

from pydantic import BaseModel

from core.logging import get_logger
from .base import BaseAgent
from .prompts import COMPLIANCE_SYSTEM, COMPLIANCE_USER

logger = get_logger(__name__)


class ComplianceSignalOutput(BaseModel):
    signal_type: str   # vulnerable_customer_cluster | complaint_spike | poor_outcome_indicator | consumer_duty_alert | none_detected
    severity: str      # high | medium | low | none
    description: str
    affected_population_estimate: str
    recommended_review_action: str
    regulatory_reference: str


class ComplianceSignalAgent(BaseAgent):
    name = "compliance_signal_agent"

    async def run(
        self,
        org_name: str,
        sentiment_summary: dict[str, Any],
        complaint_volume_trend: dict[str, Any],
        kyc_failure_rate: float,
        vulnerable_event_signals: dict[str, Any],
    ) -> ComplianceSignalOutput:
        user_prompt = COMPLIANCE_USER.format(
            org_name=org_name,
            sentiment_summary=str(sentiment_summary),
            complaint_volume_trend=str(complaint_volume_trend),
            kyc_failure_rate=round(kyc_failure_rate, 4),
            vulnerable_event_signals=str(vulnerable_event_signals),
        )

        raw = await self._call(
            system_prompt=COMPLIANCE_SYSTEM,
            user_prompt=user_prompt,
            task_type="compliance_signal_detection",
        )

        parsed = self._parse_json(raw, fallback={})
        try:
            output = ComplianceSignalOutput(
                signal_type=parsed.get("signal_type", "none_detected"),
                severity=parsed.get("severity", "none"),
                description=parsed.get("description", "No significant compliance signals detected."),
                affected_population_estimate=parsed.get("affected_population_estimate", "Unknown"),
                recommended_review_action=parsed.get("recommended_review_action", "No action required."),
                regulatory_reference=parsed.get("regulatory_reference", ""),
            )
        except Exception as exc:
            logger.warning("compliance_output_invalid", org_id=self.org_id, error=str(exc))
            output = ComplianceSignalOutput(
                signal_type="none_detected",
                severity="none",
                description="Analysis unavailable.",
                affected_population_estimate="Unknown",
                recommended_review_action="Manual review recommended.",
                regulatory_reference="",
            )

        logger.info(
            "compliance_signal_completed",
            org_id=self.org_id,
            signal_type=output.signal_type,
            severity=output.severity,
        )
        return output
