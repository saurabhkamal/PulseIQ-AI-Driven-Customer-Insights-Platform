"use client";

import { MobileShell } from "@/components/layout/MobileShell";
import { useDashboard } from "@/hooks/useDashboard";
import { useInsights } from "@/hooks/useInsights";
import { useTrends } from "@/hooks/useTrends";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { TREND_COLORS, TREND_ICONS, PRIORITY_COLORS } from "@/lib/utils";
import type { InsightPriority, SignalStrength } from "@/types";

const SIGNAL_VARIANT: Record<SignalStrength, "danger" | "warning" | "neutral"> = {
  high: "danger", medium: "warning", low: "neutral",
};
const PRIORITY_VARIANT: Record<InsightPriority, "danger" | "warning" | "neutral"> = {
  high: "danger", medium: "warning", low: "neutral",
};

export function MobileDashboard() {
  const { metrics, isLoading: kpiLoading } = useDashboard();
  const { insights, isLoading: insightsLoading } = useInsights(3);
  const { trends, isLoading: trendsLoading } = useTrends(3);

  return (
    <MobileShell title="Dashboard">
      {/* KPI Cards */}
      <section>
        <h2 className="text-[12px] font-semibold uppercase tracking-wider text-[#8A8A8A] mb-3">Key Metrics</h2>
        {kpiLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-[#D9D8D3]">
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-7 w-16 mb-1" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        ) : metrics.length === 0 ? (
          <div className="bg-white rounded-xl p-6 border border-[#D9D8D3] text-center text-[13px] text-[#8A8A8A]">
            Connect a data source to see metrics.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {metrics.map((m) => (
              <div key={m.id} className="bg-white rounded-xl p-4 border border-[#D9D8D3] shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <p className="text-[11px] font-medium text-[#8A8A8A] uppercase tracking-wide mb-1 truncate">{m.label}</p>
                <p className="text-[22px] font-bold text-[#1A1A1A] leading-tight">{m.formattedValue}</p>
                <p className={`text-[12px] font-medium mt-1 ${TREND_COLORS[m.trend]}`}>
                  {TREND_ICONS[m.trend]} {m.trendValue}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* AI Insights */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[12px] font-semibold uppercase tracking-wider text-[#8A8A8A]">AI Insights</h2>
          <a href="/insights" className="text-[12px] text-[#0A66C2] font-medium">See all</a>
        </div>
        {insightsLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 border border-[#D9D8D3]">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        ) : insights.length === 0 ? (
          <div className="bg-white rounded-xl p-5 border border-[#D9D8D3] text-center text-[13px] text-[#8A8A8A]">
            No insights yet.
          </div>
        ) : (
          <div className="space-y-3">
            {insights.map((insight) => (
              <div key={insight.id} className="bg-white rounded-xl p-4 border-l-4 border-l-[#7C3AED] border border-[#D9D8D3]">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-[14px] font-semibold text-[#1A1A1A] leading-snug">{insight.title}</p>
                  <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORITY_COLORS[insight.priority]}`}>
                    {insight.priority.charAt(0).toUpperCase() + insight.priority.slice(1)}
                  </span>
                </div>
                <p className="text-[12px] text-[#4A4A4A] line-clamp-2">{insight.description}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Badge variant="ai">AI</Badge>
                  <Badge variant={PRIORITY_VARIANT[insight.priority]}>{insight.priority}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Trends */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[12px] font-semibold uppercase tracking-wider text-[#8A8A8A]">Emerging Trends</h2>
          <a href="/analytics" className="text-[12px] text-[#0A66C2] font-medium">See all</a>
        </div>
        {trendsLoading ? (
          <div className="bg-white rounded-xl border border-[#D9D8D3] divide-y divide-[#D9D8D3]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-5 w-14" />
              </div>
            ))}
          </div>
        ) : trends.length === 0 ? (
          <div className="bg-white rounded-xl p-5 border border-[#D9D8D3] text-center text-[13px] text-[#8A8A8A]">No trends yet.</div>
        ) : (
          <div className="bg-white rounded-xl border border-[#D9D8D3] divide-y divide-[#D9D8D3]">
            {trends.map((t) => (
              <div key={t.id} className="flex items-center justify-between px-4 py-3">
                <p className="text-[13px] font-medium text-[#1A1A1A] truncate mr-3">{t.trendName}</p>
                <Badge variant={SIGNAL_VARIANT[t.signalStrength]}>
                  {t.signalStrength.charAt(0).toUpperCase() + t.signalStrength.slice(1)}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </section>
    </MobileShell>
  );
}
