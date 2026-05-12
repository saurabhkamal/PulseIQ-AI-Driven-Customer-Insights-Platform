"use client";

import { useTrendsInsights } from "@/hooks/useTrendsInsights";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

function confidenceColor(c: number): string {
  if (c >= 0.7) return "#2D9E6B";
  if (c >= 0.4) return "#E8940A";
  return "#CC3333";
}

function confidenceBg(c: number): string {
  if (c >= 0.7) return "#2D9E6B1A";
  if (c >= 0.4) return "#E8940A1A";
  return "#CC33331A";
}

export function CategoryConfidenceRanking() {
  const { data, isLoading, error } = useTrendsInsights();

  const items = data?.category_confidence ?? [];

  return (
    <Card>
      <CardHeader title="Category Confidence" />
      <p className="text-[12px] text-[#8A8A8A] -mt-2 mb-4">
        Average AI confidence per category, ranked
      </p>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full rounded" />
          ))}
        </div>
      )}

      {error && !isLoading && (
        <EmptyState title="Could not load data" description="Confidence data unavailable." />
      )}

      {!isLoading && !error && items.length === 0 && (
        <EmptyState title="No confidence data" description="Confidence scores will appear after AI analysis runs." />
      )}

      {!isLoading && !error && items.length > 0 && (
        <div className="space-y-3">
          {items.slice(0, 7).map((item, i) => {
            const pct = Math.round(item.avg_confidence * 100);
            const color = confidenceColor(item.avg_confidence);
            const bg = confidenceBg(item.avg_confidence);
            return (
              <div key={item.category} className="flex items-center gap-3">
                {/* Rank */}
                <span className="text-[11px] font-semibold text-[#8A8A8A] w-4 shrink-0">
                  {i + 1}
                </span>

                {/* Category + bar */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[12px] font-medium text-[#1A1A1A] truncate max-w-[70%]"
                      title={item.category}>
                      {item.category}
                    </span>
                    <span className="text-[11px] text-[#8A8A8A]">{item.count} trend{item.count !== 1 ? "s" : ""}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[#EAE9E4] overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, backgroundColor: color }}
                    />
                  </div>
                </div>

                {/* Score pill */}
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ color, backgroundColor: bg }}
                >
                  {pct}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
