"use client";

import { useTrendsInsights } from "@/hooks/useTrendsInsights";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

const BUCKETS = [
  {
    key: "maturing" as const,
    label: "Near-term",
    sublabel: "≤ 30 days",
    color: "#CC3333",
    bg: "#CC33331A",
    border: "#CC3333",
    description: "Act now — trends materialising within 30 days",
    icon: "⚡",
  },
  {
    key: "monitoring" as const,
    label: "Mid-term",
    sublabel: "30 – 60 days",
    color: "#E8940A",
    bg: "#E8940A1A",
    border: "#E8940A",
    description: "Monitor — approaching relevance within 2 months",
    icon: "👁",
  },
  {
    key: "emerging" as const,
    label: "Emerging",
    sublabel: "> 60 days",
    color: "#7C3AED",
    bg: "#7C3AED1A",
    border: "#7C3AED",
    description: "Horizon signal — long-range trend to track",
    icon: "🔭",
  },
] as const;

export function EmergingVsMaturingChart() {
  const { data, isLoading, error } = useTrendsInsights();

  const total = data?.total ?? 0;
  const counts = {
    maturing: data?.maturing.length ?? 0,
    monitoring: data?.monitoring.length ?? 0,
    emerging: data?.emerging.length ?? 0,
  };

  return (
    <Card>
      <CardHeader title="Emerging vs Maturing Trends" />
      <p className="text-[12px] text-[#8A8A8A] -mt-2 mb-4">
        Time-horizon classification of all active trend signals
      </p>

      {isLoading && <Skeleton className="h-[160px] w-full" />}

      {error && !isLoading && (
        <EmptyState title="Could not load data" description="Trend classification data unavailable." />
      )}

      {!isLoading && !error && total === 0 && (
        <EmptyState title="No trend data" description="Trends will appear after the AI agent processes your data." />
      )}

      {!isLoading && !error && total > 0 && (
        <div className="space-y-4">
          {/* Proportional bar */}
          <div className="flex h-3 rounded-full overflow-hidden gap-px">
            {BUCKETS.map((b) => {
              const pct = total > 0 ? (counts[b.key] / total) * 100 : 0;
              if (pct === 0) return null;
              return (
                <div
                  key={b.key}
                  className="h-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: b.color }}
                  title={`${b.label}: ${counts[b.key]} (${Math.round(pct)}%)`}
                />
              );
            })}
          </div>

          {/* Bucket cards */}
          <div className="grid grid-cols-3 gap-3">
            {BUCKETS.map((b) => {
              const count = counts[b.key];
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div
                  key={b.key}
                  className="rounded-lg border p-3 flex flex-col gap-1.5"
                  style={{
                    borderColor: b.border,
                    borderLeftWidth: 3,
                    backgroundColor: b.bg,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold" style={{ color: b.color }}>
                      {b.label}
                    </span>
                    <span className="text-[10px] text-[#8A8A8A]">{b.sublabel}</span>
                  </div>
                  <div className="text-[28px] font-bold leading-none" style={{ color: b.color }}>
                    {count}
                  </div>
                  <div className="text-[11px] text-[#8A8A8A]">
                    {pct}% of all trends
                  </div>
                  <p className="text-[11px] text-[#4A4A4A] leading-relaxed border-t pt-1.5"
                    style={{ borderColor: `${b.border}33` }}>
                    {b.description}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Top items per bucket */}
          {BUCKETS.some((b) => counts[b.key] > 0) && (
            <div className="space-y-1 pt-1 border-t border-[#D9D8D3]">
              <p className="text-[11px] font-semibold text-[#8A8A8A] uppercase tracking-wide mb-2">
                Top signals to act on now
              </p>
              {(data?.maturing ?? []).slice(0, 3).map((t) => (
                <div key={t.id} className="flex items-center gap-2 text-[12px]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#CC3333] shrink-0" />
                  <span className="truncate text-[#1A1A1A]">{t.title}</span>
                  <span className="shrink-0 text-[#8A8A8A]">
                    {t.horizon_days != null ? `${t.horizon_days}d` : "—"}
                    &nbsp;·&nbsp;{Math.round(t.confidence * 100)}%
                  </span>
                </div>
              ))}
              {(data?.maturing ?? []).length === 0 && (
                <p className="text-[12px] text-[#8A8A8A]">No near-term trends at this time.</p>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
