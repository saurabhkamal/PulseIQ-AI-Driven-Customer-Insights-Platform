"use client";

import { useState } from "react";
import { useInsights } from "@/hooks/useInsights";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import { insightsService } from "@/services/insights.service";
import type { InsightPriority } from "@/types";

// ─── Priority config ──────────────────────────────────────────────────────────

const PRIORITY_CONFIG: Record<
  InsightPriority,
  { label: string; color: string; bg: string; border: string; dots: number }
> = {
  high:   { label: "High Impact",   color: "#CC3333", bg: "rgba(204,51,51,0.08)",   border: "rgba(204,51,51,0.25)",   dots: 5 },
  medium: { label: "Medium Impact", color: "#E8940A", bg: "rgba(232,148,10,0.08)",  border: "rgba(232,148,10,0.25)",  dots: 3 },
  low:    { label: "Low Impact",    color: "#6B7280", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.25)", dots: 1 },
};

// ─── Agent display names & icons ─────────────────────────────────────────────

function cleanAgentName(agent: string): string {
  return agent.replace(/Agent$/, "").replace(/([A-Z])/g, (c, i) => (i > 0 ? " " + c : c)).trim();
}

const AGENT_COLORS: Record<string, string> = {
  BehaviorAnalysisAgent: "#0A66C2",
  TrendPredictionAgent:  "#7C3AED",
  SentimentAgent:        "#2D9E6B",
  RecommendationAgent:   "#E8940A",
};

function AgentBadge({ agentType }: { agentType: string }) {
  const color = AGENT_COLORS[agentType] ?? "#6B7280";
  const name  = cleanAgentName(agentType);

  let icon: React.ReactNode;
  if (agentType.includes("Behavior")) {
    icon = (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M2 20h20M6 20V10M12 20V4M18 20v-6" />
      </svg>
    );
  } else if (agentType.includes("Trend")) {
    icon = (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    );
  } else if (agentType.includes("Sentiment")) {
    icon = (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    );
  } else {
    icon = (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="2" x2="12" y2="6" />
        <path d="M5 19H4a2 2 0 0 1-2-2v-1a6 6 0 0 1 6-6h8a6 6 0 0 1 6 6v1a2 2 0 0 1-2 2h-1" />
        <path d="M9 19v3M15 19v3M9 19h6" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    );
  }

  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "5px",
      padding: "3px 8px", borderRadius: "99px",
      background: `${color}14`, border: `1px solid ${color}30`,
      fontSize: "11px", fontWeight: 600, color,
    }}>
      {icon}{name}
    </span>
  );
}

// ─── Impact dots ─────────────────────────────────────────────────────────────

function ImpactDots({ priority }: { priority: InsightPriority }) {
  const { dots, color } = PRIORITY_CONFIG[priority];
  return (
    <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          style={{
            width: "7px", height: "7px", borderRadius: "50%",
            background: n <= dots ? color : "#E5E7EB",
            transition: "background 0.15s",
          }}
        />
      ))}
    </div>
  );
}

// ─── Filter tabs ─────────────────────────────────────────────────────────────

const FILTERS: { label: string; value: InsightPriority | "all" }[] = [
  { label: "All", value: "all" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

// ─── Main component ───────────────────────────────────────────────────────────

export function InsightsList() {
  const [filter, setFilter]       = useState<InsightPriority | "all">("all");
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg]     = useState<string | null>(null);

  const { insights, isLoading, error } = useInsights({
    priority: filter === "all" ? undefined : filter,
    limit: 20,
  });

  async function handleRefresh() {
    setIsRefreshing(true);
    setRefreshMsg(null);
    try {
      await insightsService.refreshInsights();
      setRefreshMsg("Refresh queued. New insights will appear shortly.");
    } catch {
      setRefreshMsg("Could not queue refresh. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "#fff", border: "1px solid #D9D8D3", borderRadius: "8px", padding: "4px" }}>
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                padding: "6px 14px", borderRadius: "6px", border: "none", cursor: "pointer",
                fontSize: "13px", fontWeight: 600,
                background: filter === f.value ? "#0A66C2" : "transparent",
                color: filter === f.value ? "#fff" : "#4A4A4A",
                transition: "all 0.15s",
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Button variant="secondary" size="sm" isLoading={isRefreshing} onClick={handleRefresh}>
          ↻ Refresh Insights
        </Button>
      </div>

      {refreshMsg && (
        <div style={{ borderRadius: "6px", background: "rgba(10,102,194,0.08)", border: "1px solid rgba(10,102,194,0.2)", padding: "10px 16px", fontSize: "13px", color: "#0A66C2" }}>
          {refreshMsg}
        </div>
      )}

      {/* Skeletons */}
      {isLoading && Array.from({ length: 5 }).map((_, i) => (
        <div key={i} style={{ background: "#fff", borderRadius: "10px", border: "1px solid #D9D8D3", borderLeft: "4px solid #E5E7EB", padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-5 w-24" />
          </div>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-4/5 mb-4" />
          <div style={{ display: "flex", gap: "8px" }}>
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-20" />
          </div>
        </div>
      ))}

      {error && !isLoading && (
        <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #D9D8D3", padding: "40px" }}>
          <EmptyState title="Could not load insights" description="AI insight data is unavailable." />
        </div>
      )}

      {!isLoading && !error && insights.length === 0 && (
        <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #D9D8D3", padding: "40px" }}>
          <EmptyState
            title="No insights yet"
            description="AI insights will be generated after your data pipeline runs. Click Refresh Insights to trigger analysis."
            action={{ label: "Refresh Insights", onClick: handleRefresh }}
          />
        </div>
      )}

      {/* Cards */}
      {!isLoading && !error && insights.map((insight) => {
        const isOpen = expanded === insight.id;
        const cfg    = PRIORITY_CONFIG[insight.priority];

        return (
          <div
            key={insight.id}
            style={{
              background: "#fff",
              borderRadius: "10px",
              border: `1px solid ${cfg.border}`,
              borderLeft: `4px solid ${cfg.color}`,
              padding: "20px 24px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
              transition: "box-shadow 0.15s",
            }}
          >
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "10px" }}>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1A1A1A", lineHeight: 1.4, margin: 0, flex: 1 }}>
                {insight.title}
              </h3>

              {/* Priority badge + impact dots */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px", flexShrink: 0 }}>
                <span style={{
                  display: "inline-block", padding: "3px 10px", borderRadius: "99px",
                  fontSize: "11px", fontWeight: 700, letterSpacing: "0.03em",
                  background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
                }}>
                  {cfg.label}
                </span>
                <ImpactDots priority={insight.priority} />
              </div>
            </div>

            {/* Description */}
            <p style={{
              fontSize: "14px", color: "#4A4A4A", lineHeight: 1.65, margin: "0 0 14px",
              display: "-webkit-box", WebkitLineClamp: isOpen ? undefined : 3,
              WebkitBoxOrient: "vertical", overflow: isOpen ? "visible" : "hidden",
            } as React.CSSProperties}>
              {insight.description}
            </p>

            {/* Supporting data (expanded) */}
            {isOpen && insight.sourceDataSummary && (
              <div style={{ margin: "0 0 14px", padding: "12px 16px", background: "#F3F2EF", borderRadius: "8px", border: "1px solid #D9D8D3" }}>
                <p style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#8A8A8A", margin: "0 0 6px" }}>
                  Supporting data
                </p>
                <p style={{ fontSize: "13px", color: "#4A4A4A", margin: 0, lineHeight: 1.55 }}>
                  {insight.sourceDataSummary}
                </p>
              </div>
            )}

            {/* Footer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: "12px", borderTop: "1px solid #F3F2EF" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <AgentBadge agentType={insight.agentType} />
                <span style={{ fontSize: "11px", color: "#8A8A8A" }}>
                  {insight.model}
                </span>
                <span style={{ fontSize: "11px", color: "#8A8A8A" }} title={formatDate(insight.createdAt)}>
                  {formatRelativeTime(insight.createdAt)}
                </span>
              </div>
              <button
                onClick={() => setExpanded(isOpen ? null : insight.id)}
                style={{
                  background: "none", border: "none", cursor: "pointer", padding: "4px 0",
                  fontSize: "13px", fontWeight: 600, color: "#0A66C2",
                  transition: "color 0.15s",
                }}
              >
                {isOpen ? "Show less ↑" : "Read more ↓"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
