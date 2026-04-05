"use client";

import { useState } from "react";
import { useSentimentResults } from "@/hooks/useSentimentResults";
import { Card } from "@/components/ui/Card";
import { Skeleton, TableRowSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { SENTIMENT_COLORS, SENTIMENT_LABELS, formatDate } from "@/lib/utils";
import type { SentimentLabel } from "@/types";

const LABEL_FILTERS: { label: string; value: SentimentLabel | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Positive", value: "positive" },
  { label: "Neutral", value: "neutral" },
  { label: "Negative", value: "negative" },
];

const PAGE_SIZE = 15;

export function SentimentTable() {
  const [labelFilter, setLabelFilter] = useState<SentimentLabel | "all">("all");
  const [page, setPage] = useState(1);

  const { results, isLoading, error, total, totalPages } = useSentimentResults({
    page,
    pageSize: PAGE_SIZE,
    label: labelFilter === "all" ? undefined : labelFilter,
  });

  function handleFilterChange(val: SentimentLabel | "all") {
    setLabelFilter(val);
    setPage(1);
  }

  return (
    <Card padding={false}>
      <div className="p-6 pb-4 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-[15px] font-semibold text-[#1A1A1A]">
          Feedback Results
          {!isLoading && total > 0 && (
            <span className="ml-2 text-[13px] font-normal text-[#8A8A8A]">
              ({total.toLocaleString()} total)
            </span>
          )}
        </h3>

        {/* Label filter */}
        <div className="flex items-center gap-1 bg-[#F3F2EF] border border-[#D9D8D3] rounded-lg p-1">
          {LABEL_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => handleFilterChange(f.value)}
              className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                labelFilter === f.value
                  ? "bg-white text-[#1A1A1A] shadow-sm"
                  : "text-[#4A4A4A] hover:bg-white/60"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#D9D8D3]">
                <th className="px-6 py-3"><Skeleton className="h-3 w-16" /></th>
                <th className="px-4 py-3"><Skeleton className="h-3 w-20" /></th>
                <th className="px-4 py-3"><Skeleton className="h-3 w-16" /></th>
                <th className="px-4 py-3"><Skeleton className="h-3 w-12" /></th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 8 }).map((_, i) => (
                <TableRowSkeleton key={i} columns={4} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {error && !isLoading && (
        <div className="p-6">
          <EmptyState title="Could not load results" description="Sentiment results unavailable." />
        </div>
      )}

      {!isLoading && !error && results.length === 0 && (
        <div className="p-6">
          <EmptyState
            title="No results found"
            description={labelFilter === "all" ? "No sentiment results yet." : `No ${labelFilter} feedback found.`}
          />
        </div>
      )}

      {!isLoading && !error && results.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-[#D9D8D3] bg-white">
                  <th className="text-left px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
                    Feedback ID
                  </th>
                  <th className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
                    Product
                  </th>
                  <th className="text-center px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
                    Sentiment
                  </th>
                  <th className="text-right px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
                    Score
                  </th>
                  <th className="text-right px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, i) => (
                  <tr
                    key={result.id}
                    className={`border-b border-[#D9D8D3] hover:bg-[#F0F7FF] transition-colors ${
                      i % 2 === 0 ? "bg-white" : "bg-[#F9F9F7]"
                    }`}
                  >
                    <td className="px-6 py-3 font-mono text-[12px] text-[#6B7280]">
                      {result.feedbackId.slice(0, 8)}…
                    </td>
                    <td className="px-4 py-3 text-[#4A4A4A]">
                      {result.productName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center rounded px-2.5 py-1 text-[11px] font-medium ${SENTIMENT_COLORS[result.label]}`}
                      >
                        {SENTIMENT_LABELS[result.label]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-[#1A1A1A]">
                      {(result.score * 100).toFixed(0)}%
                    </td>
                    <td className="px-6 py-3 text-right text-[#8A8A8A]">
                      {formatDate(result.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-[#D9D8D3]">
              <p className="text-[13px] text-[#8A8A8A]">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="h-8 px-3 rounded-[6px] border border-[#D9D8D3] text-[13px] font-medium text-[#4A4A4A] hover:bg-[#EAE9E4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="h-8 px-3 rounded-[6px] border border-[#D9D8D3] text-[13px] font-medium text-[#4A4A4A] hover:bg-[#EAE9E4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
