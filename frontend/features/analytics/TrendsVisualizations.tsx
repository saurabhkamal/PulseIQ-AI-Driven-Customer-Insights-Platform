"use client";

import { useTrends } from "@/hooks/useTrends";
import { TrendStatsStrip } from "./TrendStatsStrip";
import { TrendScatterPlot } from "./TrendScatterPlot";
import { TrendSignalDonut } from "./TrendSignalDonut";
import { TrendConfidenceChart } from "./TrendConfidenceChart";

export function TrendsVisualizations() {
  const { trends, isLoading } = useTrends({ limit: 50 });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Stats strip */}
      <TrendStatsStrip trends={trends} isLoading={isLoading} />

      {/* Scatter + Donut row */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "24px" }}>
        <TrendScatterPlot trends={trends} isLoading={isLoading} />
        <TrendSignalDonut trends={trends} isLoading={isLoading} />
      </div>

      {/* Confidence bar chart */}
      <TrendConfidenceChart trends={trends} isLoading={isLoading} />
    </div>
  );
}
