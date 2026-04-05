"use client";

import { MobileShell } from "@/components/layout/MobileShell";
import { useFunnel, useCohort } from "@/hooks/useAnalytics";
import { useTrends } from "@/hooks/useTrends";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import type { SignalStrength } from "@/types";

const SIGNAL_VARIANT: Record<SignalStrength, "danger" | "warning" | "neutral"> = {
  high: "danger",
  medium: "warning",
  low: "neutral",
};

function retentionColor(pct: number): string {
  if (pct >= 70) return "bg-[#2D9E6B]";
  if (pct >= 40) return "bg-[#E8940A]";
  if (pct > 0) return "bg-[#CC3333]";
  return "bg-[#EAE9E4]";
}

export function MobileAnalytics() {
  const { steps, isLoading: funnelLoading, error: funnelError } = useFunnel();
  const { rows, isLoading: cohortLoading, error: cohortError } = useCohort();
  const { trends, isLoading: trendsLoading } = useTrends(5);

  return (
    <MobileShell title="Analytics">
      {/* Funnel Section */}
      <section>
        <h2 className="text-[12px] font-semibold uppercase tracking-wider text-[#8A8A8A] mb-3">
          Conversion Funnel
        </h2>

        {funnelLoading ? (
          <div className="bg-white rounded-xl border border-[#D9D8D3] p-4 space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="flex justify-between mb-1">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </div>
            ))}
          </div>
        ) : funnelError ? (
          <div className="bg-white rounded-xl p-4 border border-[#D9D8D3] text-center text-[13px] text-[#CC3333]">
            Failed to load funnel data.
          </div>
        ) : steps.length === 0 ? (
          <EmptyState title="No funnel data" description="Funnel data will appear after events are ingested." />
        ) : (
          <div className="bg-white rounded-xl border border-[#D9D8D3] p-4 space-y-3">
            {steps.map((step, idx) => (
              <div key={idx}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[13px] font-medium text-[#1A1A1A]">{step.step}</span>
                  <span className="text-[12px] text-[#4A4A4A]">
                    {step.count.toLocaleString()}
                    <span className="text-[#8A8A8A] ml-1">({step.rate.toFixed(1)}%)</span>
                  </span>
                </div>
                <div className="h-2 bg-[#EAE9E4] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0A66C2] rounded-full transition-all"
                    style={{ width: `${Math.min(step.rate, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Cohort Section */}
      <section>
        <h2 className="text-[12px] font-semibold uppercase tracking-wider text-[#8A8A8A] mb-3">
          Cohort Retention
        </h2>

        {cohortLoading ? (
          <div className="overflow-x-auto">
            <div className="bg-white rounded-xl border border-[#D9D8D3] p-4 min-w-[320px]">
              <Skeleton className="h-4 w-full mb-3" />
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-8 w-full mb-2" />
              ))}
            </div>
          </div>
        ) : cohortError ? (
          <div className="bg-white rounded-xl p-4 border border-[#D9D8D3] text-center text-[13px] text-[#CC3333]">
            Failed to load cohort data.
          </div>
        ) : rows.length === 0 ? (
          <EmptyState title="No cohort data" description="Cohort data will appear after sufficient user activity." />
        ) : (
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="bg-white rounded-xl border border-[#D9D8D3] min-w-[360px]">
              {/* Table header */}
              <div className="flex items-center px-3 py-2 border-b border-[#D9D8D3] bg-[#F9F9F7] rounded-t-xl">
                <span className="text-[11px] font-semibold uppercase text-[#8A8A8A] w-24 shrink-0">Cohort</span>
                <span className="text-[11px] font-semibold uppercase text-[#8A8A8A] w-12 shrink-0">Size</span>
                <span className="text-[11px] font-semibold uppercase text-[#8A8A8A]">Week →</span>
              </div>

              {rows.map((row, ri) => (
                <div
                  key={ri}
                  className={`flex items-center px-3 py-2 ${ri < rows.length - 1 ? "border-b border-[#D9D8D3]" : ""}`}
                >
                  <span className="text-[12px] text-[#1A1A1A] font-medium w-24 shrink-0 truncate">{row.cohort}</span>
                  <span className="text-[12px] text-[#4A4A4A] w-12 shrink-0">{row.size}</span>
                  <div className="flex gap-1 flex-wrap">
                    {row.retentionByWeek.map((pct, wi) => (
                      <span
                        key={wi}
                        title={`Week ${wi + 1}: ${pct}%`}
                        className={`inline-flex items-center justify-center w-8 h-7 rounded text-[10px] font-semibold text-white ${retentionColor(pct)}`}
                      >
                        {pct > 0 ? `${pct}%` : "—"}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Trends Section */}
      <section>
        <h2 className="text-[12px] font-semibold uppercase tracking-wider text-[#8A8A8A] mb-3">
          Emerging Trends
        </h2>

        {trendsLoading ? (
          <div className="bg-white rounded-xl border border-[#D9D8D3] divide-y divide-[#D9D8D3]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="px-4 py-3">
                <Skeleton className="h-4 w-40 mb-2" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        ) : trends.length === 0 ? (
          <EmptyState title="No trends" description="Trend predictions will appear after data analysis." />
        ) : (
          <div className="bg-white rounded-xl border border-[#D9D8D3] divide-y divide-[#D9D8D3]">
            {trends.map((t) => (
              <div key={t.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-[13px] font-medium text-[#1A1A1A]">{t.trendName}</p>
                  <Badge variant={SIGNAL_VARIANT[t.signalStrength]}>
                    {t.signalStrength.charAt(0).toUpperCase() + t.signalStrength.slice(1)}
                  </Badge>
                </div>
                <p className="text-[12px] text-[#4A4A4A] line-clamp-2">{t.description}</p>
                <p className="text-[11px] text-[#8A8A8A] mt-1">
                  Confidence: {(t.confidence * 100).toFixed(0)}% · {t.forecastPeriod}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </MobileShell>
  );
}
