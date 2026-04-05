"use client";

import Link from "next/link";
import { useSentimentSummary } from "@/hooks/useSentimentSummary";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPercent } from "@/lib/utils";

export function SentimentSummaryCard() {
  const { summary, isLoading, error } = useSentimentSummary();

  return (
    <Card>
      <CardHeader
        title="Sentiment"
        action={
          <Link
            href="/sentiment"
            className="text-[13px] text-[#0A66C2] hover:text-[#004182] font-medium transition-colors"
          >
            View all
          </Link>
        }
      />

      {isLoading && (
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      )}

      {error && !isLoading && (
        <EmptyState title="Could not load" description="Sentiment data unavailable." />
      )}

      {!isLoading && !error && !summary && (
        <EmptyState title="No data yet" description="Sentiment results will appear after feedback is processed." />
      )}

      {!isLoading && !error && summary && (
        <div className="space-y-3">
          <SentimentBar label="Positive" value={summary.positive} total={summary.total} color="#2D9E6B" />
          <SentimentBar label="Neutral" value={summary.neutral} total={summary.total} color="#6B7280" />
          <SentimentBar label="Negative" value={summary.negative} total={summary.total} color="#CC3333" />
          <p className="text-[12px] text-[#8A8A8A] pt-1 border-t border-[#D9D8D3]">
            Based on {summary.total.toLocaleString()} reviews
          </p>
        </div>
      )}
    </Card>
  );
}

function SentimentBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-[12px] mb-1">
        <span className="text-[#4A4A4A]">{label}</span>
        <span className="font-medium text-[#1A1A1A]">{formatPercent(pct)}</span>
      </div>
      <div className="h-2 rounded-full bg-[#EAE9E4] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
          role="progressbar"
          aria-valuenow={Math.round(pct)}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${label}: ${formatPercent(pct)}`}
        />
      </div>
    </div>
  );
}
