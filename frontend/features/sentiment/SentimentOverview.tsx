"use client";

import { useSentimentSummary } from "@/hooks/useSentimentSummary";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPercent } from "@/lib/utils";

export function SentimentOverview() {
  const { summary, isLoading, error } = useSentimentSummary();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <Skeleton className="h-3 w-20 mb-3" />
            <Skeleton className="h-8 w-24 mb-2" />
            <Skeleton className="h-2 w-full" />
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <EmptyState title="Could not load sentiment" description="Sentiment summary unavailable." />
      </Card>
    );
  }

  if (!summary) {
    return (
      <Card>
        <EmptyState title="No sentiment data" description="Sentiment results will appear after customer feedback is processed." />
      </Card>
    );
  }

  const items = [
    { label: "Positive", value: summary.positive, color: "#2D9E6B", border: "border-l-[#2D9E6B]" },
    { label: "Neutral", value: summary.neutral, color: "#6B7280", border: "border-l-[#6B7280]" },
    { label: "Negative", value: summary.negative, color: "#CC3333", border: "border-l-[#CC3333]" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {items.map((item) => {
        const pct = summary.total > 0 ? (item.value / summary.total) * 100 : 0;
        return (
          <div
            key={item.label}
            className={`bg-white rounded-lg border border-[#D9D8D3] border-l-4 ${item.border} shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6`}
          >
            <p className="text-[12px] font-medium text-[#6B7280] uppercase tracking-wide mb-2">
              {item.label}
            </p>
            <p className="text-[32px] font-bold text-[#1A1A1A] leading-none mb-3">
              {formatPercent(pct, 1)}
            </p>
            <div className="h-1.5 rounded-full bg-[#EAE9E4] overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: item.color }}
              />
            </div>
            <p className="text-[12px] text-[#8A8A8A]">
              {item.value.toLocaleString()} of {summary.total.toLocaleString()} reviews
            </p>
          </div>
        );
      })}
    </div>
  );
}
