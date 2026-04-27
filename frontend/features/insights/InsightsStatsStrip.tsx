"use client";

import type { Insight } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatRelativeTime } from "@/lib/utils";

interface Props {
  insights: Insight[];
  isLoading: boolean;
}

export function InsightsStatsStrip({ insights, isLoading }: Props) {
  if (isLoading) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ background: "#fff", borderRadius: "10px", border: "1px solid #D9D8D3", padding: "20px" }}>
            <Skeleton className="h-3 w-20 mb-3" />
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>
    );
  }

  const total = insights.length;
  const high = insights.filter((i) => i.priority === "high").length;
  const medium = insights.filter((i) => i.priority === "medium").length;
  const low = insights.filter((i) => i.priority === "low").length;
  const agents = new Set(insights.map((i) => i.agentType)).size;
  const latest = insights.reduce<string | null>((acc, i) => {
    if (!acc || i.createdAt > acc) return i.createdAt;
    return acc;
  }, null);

  const stats = [
    {
      label: "Total Insights",
      value: total,
      suffix: "",
      sub: `${high} high · ${medium} medium · ${low} low`,
      color: "#7C3AED",
      bg: "rgba(124,58,237,0.07)",
      border: "rgba(124,58,237,0.2)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18V4m6.36 2.64L5.64 19.36M22 12H2m17.36 6.36L4.64 5.64" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: "High Priority",
      value: high,
      suffix: "",
      sub: total > 0 ? `${Math.round((high / total) * 100)}% of all insights` : "—",
      color: "#CC3333",
      bg: "rgba(204,51,51,0.07)",
      border: "rgba(204,51,51,0.2)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: "Active Agents",
      value: agents,
      suffix: "",
      sub: "AI agents generating insights",
      color: "#3B82F6",
      bg: "rgba(59,130,246,0.07)",
      border: "rgba(59,130,246,0.2)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="3" width="20" height="14" rx="2" />
          <path d="M8 21h8M12 17v4" strokeLinecap="round" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
    },
    {
      label: "Last Generated",
      value: latest ? formatRelativeTime(latest) : "—",
      suffix: "",
      sub: "most recent AI analysis",
      color: "#E8940A",
      bg: "rgba(232,148,10,0.07)",
      border: "rgba(232,148,10,0.2)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" strokeLinecap="round" />
        </svg>
      ),
    },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "16px" }}>
      {stats.map((s) => (
        <div
          key={s.label}
          style={{
            background: "#fff",
            borderRadius: "10px",
            border: `1px solid ${s.border}`,
            padding: "20px",
            borderLeft: `4px solid ${s.color}`,
            boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <span style={{ fontSize: "12px", fontWeight: 600, color: "#6B7280", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {s.label}
            </span>
            <div style={{ color: s.color, background: s.bg, padding: "6px", borderRadius: "6px" }}>
              {s.icon}
            </div>
          </div>
          <div style={{ fontSize: "32px", fontWeight: 800, color: "#1A1A1A", lineHeight: 1, marginBottom: "6px" }}>
            {s.value}{s.suffix}
          </div>
          <div style={{ fontSize: "12px", color: "#8A8A8A" }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}
