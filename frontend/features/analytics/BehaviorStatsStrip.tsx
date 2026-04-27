"use client";

import type { FunnelData, CohortData } from "@/services/analytics.service";
import { Skeleton } from "@/components/ui/Skeleton";

interface Props {
  funnelData: FunnelData | null;
  cohortData: CohortData | null;
  isLoading: boolean;
}

export function BehaviorStatsStrip({ funnelData, cohortData, isLoading }: Props) {
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

  const totalUsers = funnelData?.steps[0]?.count ?? 0;
  const overallConv = Math.round(funnelData?.overallConversion ?? 0);

  const week1Vals = (cohortData?.rows ?? [])
    .map((r) => r.retention[1])
    .filter((v): v is number => v !== undefined);
  const avgWeek1 = week1Vals.length > 0
    ? Math.round(week1Vals.reduce((a, b) => a + b, 0) / week1Vals.length)
    : 0;

  const dropSteps = (funnelData?.steps ?? []).slice(1);
  const biggestDrop = dropSteps.reduce<{ step: string; drop: number } | null>((worst, s) => {
    const drop = Math.round(100 - s.conversionRate);
    return !worst || drop > worst.drop ? { step: s.step, drop } : worst;
  }, null);

  const stats = [
    {
      label: "Total Users",
      value: totalUsers > 0 ? totalUsers.toLocaleString() : "—",
      sub: `${funnelData?.steps.length ?? 0} funnel stages tracked`,
      color: "#7C3AED",
      bg: "rgba(124,58,237,0.07)",
      border: "rgba(124,58,237,0.2)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" strokeLinecap="round" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: "Overall Conversion",
      value: `${overallConv}%`,
      sub: overallConv >= 10 ? "Strong funnel performance" : overallConv >= 5 ? "Moderate conversion" : "Needs optimization",
      color: "#2D9E6B",
      bg: "rgba(45,158,107,0.07)",
      border: "rgba(45,158,107,0.2)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      label: "Avg Week-1 Retention",
      value: avgWeek1 > 0 ? `${avgWeek1}%` : "—",
      sub: avgWeek1 >= 50 ? "Excellent early retention" : avgWeek1 >= 30 ? "Good retention" : "Room to improve",
      color: "#3B82F6",
      bg: "rgba(59,130,246,0.07)",
      border: "rgba(59,130,246,0.2)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="17 1 21 5 17 9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M3 11V9a4 4 0 0 1 4-4h14M7 23l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21 13v2a4 4 0 0 1-4 4H3" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: "Biggest Drop-off",
      value: biggestDrop ? `-${biggestDrop.drop}%` : "—",
      sub: biggestDrop ? `At "${biggestDrop.step}"` : "No funnel data",
      color: "#CC3333",
      bg: "rgba(204,51,51,0.07)",
      border: "rgba(204,51,51,0.2)",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <polyline points="23 18 13.5 8.5 8.5 13.5 1 6" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="17 18 23 18 23 12" strokeLinecap="round" strokeLinejoin="round" />
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
            {s.value}
          </div>
          <div style={{ fontSize: "12px", color: "#8A8A8A" }}>{s.sub}</div>
        </div>
      ))}
    </div>
  );
}
