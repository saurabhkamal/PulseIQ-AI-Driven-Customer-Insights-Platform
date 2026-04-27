"use client";

import { useEffect, useState } from "react";
import { analyticsService } from "@/services/analytics.service";
import type { FunnelData, CohortData } from "@/services/analytics.service";
import { BehaviorStatsStrip } from "./BehaviorStatsStrip";
import { BehaviorFunnelSVG } from "./BehaviorFunnelSVG";
import { RetentionCurveChart } from "./RetentionCurveChart";

export function BehaviorVisualizations() {
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [cohortData, setCohortData] = useState<CohortData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    Promise.all([
      analyticsService.getFunnelData(),
      analyticsService.getCohortData(),
    ])
      .then(([funnel, cohort]) => {
        if (!cancelled) {
          setFunnelData(funnel);
          setCohortData(cohort);
        }
      })
      .catch(() => {
        // each sub-component handles null data gracefully
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Stats strip */}
      <BehaviorStatsStrip funnelData={funnelData} cohortData={cohortData} isLoading={isLoading} />

      {/* SVG funnel + retention curve side by side */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        <BehaviorFunnelSVG funnelData={funnelData} isLoading={isLoading} />
        <RetentionCurveChart cohortData={cohortData} isLoading={isLoading} />
      </div>
    </div>
  );
}
