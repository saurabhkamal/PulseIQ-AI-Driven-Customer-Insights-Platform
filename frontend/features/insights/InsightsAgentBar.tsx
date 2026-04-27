"use client";

import { useState } from "react";
import type { Insight } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";

interface Props {
  insights: Insight[];
  isLoading: boolean;
}

function cleanAgentName(agent: string): string {
  return agent.replace(/Agent$/, "").replace(/([A-Z])/g, (c, i) => (i > 0 ? " " + c : c)).trim();
}

const AGENT_COLORS: Record<string, [string, string]> = {
  BehaviorAnalysisAgent:  ["#0A66C2", "#1878D4"],
  TrendPredictionAgent:   ["#7C3AED", "#9333EA"],
  SentimentAgent:         ["#2D9E6B", "#34A876"],
  RecommendationAgent:    ["#E8940A", "#F59E0B"],
};
const DEFAULT_COLOR: [string, string] = ["#6B7280", "#9CA3AF"];

function AgentIcon({ agentType }: { agentType: string }) {
  if (agentType.includes("Behavior")) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M2 20h20M6 20V10M12 20V4M18 20v-6" />
      </svg>
    );
  }
  if (agentType.includes("Trend")) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    );
  }
  if (agentType.includes("Sentiment")) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    );
  }
  if (agentType.includes("Recommendation")) {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="2" x2="12" y2="6" />
        <path d="M5 19H4a2 2 0 0 1-2-2v-1a6 6 0 0 1 6-6h8a6 6 0 0 1 6 6v1a2 2 0 0 1-2 2h-1" />
        <path d="M9 19v3M15 19v3M9 19h6" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
    </svg>
  );
}

export function InsightsAgentBar({ insights, isLoading }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #D9D8D3", padding: "24px" }}>
        <Skeleton className="h-5 w-44 mb-6" />
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
            <Skeleton className="h-3 w-36" />
            <Skeleton className="h-7 flex-1" />
            <Skeleton className="h-3 w-8" />
          </div>
        ))}
      </div>
    );
  }

  if (insights.length === 0) return null;

  // Group by agentType, count, sort desc
  const agentMap: Record<string, number> = {};
  for (const ins of insights) {
    agentMap[ins.agentType] = (agentMap[ins.agentType] ?? 0) + 1;
  }
  const agents = Object.entries(agentMap)
    .map(([agentType, count]) => ({ agentType, count }))
    .sort((a, b) => b.count - a.count);

  const maxCount = agents[0]?.count ?? 1;

  return (
    <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #D9D8D3", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      <div style={{ marginBottom: "24px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1A1A1A", margin: "0 0 2px" }}>Agent Attribution</h3>
        <p style={{ fontSize: "12px", color: "#8A8A8A", margin: 0 }}>
          Insights generated per AI agent · hover for details
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {agents.map(({ agentType, count }) => {
          const pct = (count / maxCount) * 100;
          const [c1, c2] = AGENT_COLORS[agentType] ?? DEFAULT_COLOR;
          const isHov = hovered === agentType;
          const name = cleanAgentName(agentType);

          return (
            <div
              key={agentType}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "8px 10px", borderRadius: "8px",
                background: isHov ? `${c1}10` : "transparent",
                border: `1px solid ${isHov ? c1 + "30" : "transparent"}`,
                cursor: "default", transition: "all 0.15s",
              }}
              onMouseEnter={() => setHovered(agentType)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Icon */}
              <div style={{
                width: "28px", height: "28px", borderRadius: "6px", flexShrink: 0,
                background: isHov ? `${c1}18` : "#F3F2EF",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: isHov ? c1 : "#6B7280",
                transition: "all 0.15s",
              }}>
                <AgentIcon agentType={agentType} />
              </div>

              {/* Agent name */}
              <span style={{
                width: "150px", flexShrink: 0,
                fontSize: "13px", fontWeight: 600,
                color: isHov ? "#1A1A1A" : "#4A4A4A",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                transition: "color 0.15s",
              }}>
                {name}
              </span>

              {/* Bar track */}
              <div style={{ flex: 1, height: "8px", background: "#F3F2EF", borderRadius: "99px", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: "99px",
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${c1}cc, ${c2})`,
                  boxShadow: isHov ? `0 0 8px ${c1}60` : "none",
                  transition: "box-shadow 0.2s, width 0.6s ease",
                }} />
              </div>

              {/* Count */}
              <span style={{
                width: "32px", flexShrink: 0, textAlign: "right",
                fontSize: "13px", fontWeight: 700,
                color: isHov ? c1 : "#6B7280",
                transition: "color 0.15s",
              }}>
                {count}
              </span>

              {/* Color dot */}
              <div style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: c1, flexShrink: 0,
                boxShadow: isHov ? `0 0 6px ${c1}` : "none",
                transition: "box-shadow 0.2s",
              }} />
            </div>
          );
        })}
      </div>

      <p style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #F3F2EF", fontSize: "11px", color: "#8A8A8A", margin: "16px 0 0" }}>
        {agents.length} active agent{agents.length !== 1 ? "s" : ""} · {insights.length} total insights generated
      </p>
    </div>
  );
}
