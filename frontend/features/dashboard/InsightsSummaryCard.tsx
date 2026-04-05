"use client";

import Link from "next/link";
import { useInsights } from "@/hooks/useInsights";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { PRIORITY_COLORS } from "@/lib/utils";
import type { InsightPriority } from "@/types";

const PRIORITY_VARIANT: Record<InsightPriority, "danger" | "warning" | "neutral"> = {
  high: "danger",
  medium: "warning",
  low: "neutral",
};

export function InsightsSummaryCard() {
  const { insights, isLoading, error } = useInsights({ limit: 5 });

  return (
    <Card>
      <CardHeader
        title="AI Insights"
        action={
          <Link
            href="/insights"
            className="text-[13px] text-[#0A66C2] hover:text-[#004182] font-medium transition-colors"
          >
            View all
          </Link>
        }
      />

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      )}

      {error && !isLoading && (
        <EmptyState
          title="Could not load insights"
          description="There was a problem fetching AI insights."
        />
      )}

      {!isLoading && !error && insights.length === 0 && (
        <EmptyState
          title="No insights yet"
          description="AI insights will appear here after your data is processed."
        />
      )}

      {!isLoading && !error && insights.length > 0 && (
        <ul className="space-y-4">
          {insights.map((insight) => (
            <li
              key={insight.id}
              className="border-l-4 border-l-[#7C3AED] pl-4 py-1"
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[14px] font-medium text-[#1A1A1A] leading-snug">
                  {insight.title}
                </p>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant="ai">AI</Badge>
                  <span
                    className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${PRIORITY_COLORS[insight.priority]}`}
                  >
                    {insight.priority.charAt(0).toUpperCase() + insight.priority.slice(1)}
                  </span>
                </div>
              </div>
              <p className="text-[12px] text-[#8A8A8A] mt-1 line-clamp-2">
                {insight.description}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
