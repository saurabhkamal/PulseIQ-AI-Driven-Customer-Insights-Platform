"use client";

import type { TrendPrediction } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";

function parseDays(period: string): number {
  const m = period.match(/(\d+)/);
  return m ? parseInt(m[1]) : 30;
}

interface Props {
  trends: TrendPrediction[];
  isLoading: boolean;
}

export function TrendStatsStrip({ trends, isLoading }: Props) {
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

  const total = trends.length;
  const high = trends.filter((t) => t.signalStrength === "high").length;
  const medium = trends.filter((t) => t.signalStrength === "medium").length;
  const avgConf = total > 0
    ? Math.round((trends.reduce((s, t) => s + t.confidence, 0) / total) * 100)
    : 0;
  const avgHorizon = total > 0
    ? Math.round(trends.reduce((s, t) => s + parseDays(t.forecastPeriod), 0) / total)
    : 0;

  const stats = [
    {
      label: "Total Trends",
      value: total,
      suffix: "",
      sub: `${medium} medium · ${trends.filter((t) => t.signalStrength === "low").length} low`,
      color: "#7C3AED",
      bg: "rgba(124,58,237,0.07)",
      border: "rgba(124,58,237,0.2)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M2 20h20M6 20V10M12 20V4M18 20v-6" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: "High Signal",
      value: high,
      suffix: "",
      sub: total > 0 ? `${Math.round((high / total) * 100)}% of all trends` : "—",
      color: "#2D9E6B",
      bg: "rgba(45,158,107,0.07)",
      border: "rgba(45,158,107,0.2)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: "Avg Confidence",
      value: avgConf,
      suffix: "%",
      sub: avgConf >= 70 ? "Strong AI certainty" : avgConf >= 40 ? "Moderate certainty" : "Low certainty",
      color: "#3B82F6",
      bg: "rgba(59,130,246,0.07)",
      border: "rgba(59,130,246,0.2)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: "Avg Horizon",
      value: avgHorizon,
      suffix: " days",
      sub: avgHorizon <= 30 ? "Short-term focus" : avgHorizon <= 60 ? "Mid-term outlook" : "Long-term forecast",
      color: "#F59E0B",
      bg: "rgba(245,158,11,0.07)",
      border: "rgba(245,158,11,0.2)",
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
