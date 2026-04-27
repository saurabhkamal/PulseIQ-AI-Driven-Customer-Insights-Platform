"use client";

import { useInsights } from "@/hooks/useInsights";
import { InsightsStatsStrip } from "./InsightsStatsStrip";
import { InsightsPriorityDonut } from "./InsightsPriorityDonut";
import { InsightsAgentBar } from "./InsightsAgentBar";

export function InsightsVisualizations() {
  const { insights, isLoading } = useInsights({ limit: 100 });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <InsightsStatsStrip insights={insights} isLoading={isLoading} />
      <div style={{ display: "grid", gridTemplateColumns: "2fr 3fr", gap: "24px" }}>
        <InsightsPriorityDonut insights={insights} isLoading={isLoading} />
        <InsightsAgentBar insights={insights} isLoading={isLoading} />
      </div>
    </div>
  );
}
