"use client";

import { MobileShell } from "@/components/layout/MobileShell";
import { useSentimentSummary, useSentimentResults } from "@/hooks/useSentiment";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelativeTime } from "@/lib/utils";
import type { SentimentLabel } from "@/types";

const SENTIMENT_BAR_COLOR: Record<SentimentLabel, string> = {
  positive: "bg-[#2D9E6B]",
  neutral: "bg-[#6B7280]",
  negative: "bg-[#CC3333]",
};

const SENTIMENT_VARIANT: Record<SentimentLabel, "success" | "neutral" | "danger"> = {
  positive: "success",
  neutral: "neutral",
  negative: "danger",
};

const SENTIMENT_LABELS: { key: SentimentLabel; label: string }[] = [
  { key: "positive", label: "Positive" },
  { key: "neutral", label: "Neutral" },
  { key: "negative", label: "Negative" },
];

export function MobileSentiment() {
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useSentimentSummary();
  const { results, isLoading: resultsLoading, error: resultsError } = useSentimentResults(15);

  return (
    <MobileShell title="Sentiment">
      {/* Summary Section */}
      <section>
        <h2 className="text-[12px] font-semibold uppercase tracking-wider text-[#8A8A8A] mb-3">
          Overall Sentiment
        </h2>

        {summaryLoading ? (
          <div className="bg-white rounded-xl border border-[#D9D8D3] p-4 space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="text-center">
                  <Skeleton className="h-8 w-12 mx-auto mb-1" />
                  <Skeleton className="h-3 w-16 mx-auto" />
                </div>
              ))}
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
          </div>
        ) : summaryError ? (
          <div className="bg-white rounded-xl p-4 border border-[#D9D8D3] text-center text-[13px] text-[#CC3333]">
            Failed to load sentiment summary.
          </div>
        ) : !summary ? (
          <EmptyState title="No sentiment data" description="Sentiment analysis will run after feedback is ingested." />
        ) : (
          <div className="bg-white rounded-xl border border-[#D9D8D3] p-4">
            {/* Score cards */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {SENTIMENT_LABELS.map(({ key, label }) => {
                const count = summary[key];
                const pct = summary.total > 0 ? ((count / summary.total) * 100).toFixed(0) : "0";
                return (
                  <div key={key} className="text-center">
                    <p className="text-[24px] font-bold text-[#1A1A1A] leading-tight">{pct}%</p>
                    <p className="text-[11px] text-[#8A8A8A] mt-0.5">{label}</p>
                    <p className="text-[11px] text-[#4A4A4A]">{count.toLocaleString()}</p>
                  </div>
                );
              })}
            </div>

            {/* Stacked bar */}
            {summary.total > 0 && (
              <div className="flex rounded-full overflow-hidden h-2.5">
                {SENTIMENT_LABELS.map(({ key }) => {
                  const pct = (summary[key] / summary.total) * 100;
                  return pct > 0 ? (
                    <div
                      key={key}
                      className={`h-full ${SENTIMENT_BAR_COLOR[key]}`}
                      style={{ width: `${pct}%` }}
                    />
                  ) : null;
                })}
              </div>
            )}

            <p className="text-[11px] text-[#8A8A8A] mt-2 text-center">
              {summary.total.toLocaleString()} total · avg score {summary.averageScore.toFixed(2)}
            </p>
          </div>
        )}
      </section>

      {/* Recent Feedback Section */}
      <section>
        <h2 className="text-[12px] font-semibold uppercase tracking-wider text-[#8A8A8A] mb-3">
          Recent Feedback
        </h2>

        {resultsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-[#D9D8D3] px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-3 w-28" />
              </div>
            ))}
          </div>
        ) : resultsError ? (
          <div className="bg-white rounded-xl p-4 border border-[#D9D8D3] text-center text-[13px] text-[#CC3333]">
            Failed to load feedback results.
          </div>
        ) : results.length === 0 ? (
          <EmptyState title="No feedback yet" description="Feedback results will appear after sentiment analysis runs." />
        ) : (
          <div className="bg-white rounded-xl border border-[#D9D8D3] divide-y divide-[#D9D8D3]">
            {results.map((result) => (
              <div key={result.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge variant={SENTIMENT_VARIANT[result.label]}>
                      {result.label.charAt(0).toUpperCase() + result.label.slice(1)}
                    </Badge>
                    <span className="text-[11px] text-[#8A8A8A]">
                      Score: {result.score.toFixed(2)}
                    </span>
                  </div>
                  {result.productName && (
                    <p className="text-[12px] text-[#4A4A4A] truncate">{result.productName}</p>
                  )}
                </div>
                <span className="text-[11px] text-[#8A8A8A] shrink-0">
                  {formatRelativeTime(result.createdAt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </MobileShell>
  );
}
