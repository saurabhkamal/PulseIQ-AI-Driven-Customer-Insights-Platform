"use client";

import { useState } from "react";
import { useInsights } from "@/hooks/useInsights";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { PRIORITY_COLORS, formatDate, formatRelativeTime } from "@/lib/utils";
import { insightsService } from "@/services/insights.service";
import type { InsightPriority } from "@/types";

const PRIORITY_VARIANT: Record<InsightPriority, "danger" | "warning" | "neutral"> = {
  high: "danger",
  medium: "warning",
  low: "neutral",
};

const FILTERS: { label: string; value: InsightPriority | "all" }[] = [
  { label: "All", value: "all" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

export function InsightsList() {
  const [filter, setFilter] = useState<InsightPriority | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState<string | null>(null);

  const { insights, isLoading, error } = useInsights({
    priority: filter === "all" ? undefined : filter,
    limit: 20,
  });

  async function handleRefresh() {
    setIsRefreshing(true);
    setRefreshMsg(null);
    try {
      await insightsService.refreshInsights();
      setRefreshMsg("Refresh queued. New insights will appear shortly.");
    } catch {
      setRefreshMsg("Could not queue refresh. Please try again.");
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Priority filter tabs */}
        <div className="flex items-center gap-1 bg-white border border-[#D9D8D3] rounded-lg p-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors ${
                filter === f.value
                  ? "bg-[#0A66C2] text-white"
                  : "text-[#4A4A4A] hover:bg-[#EAE9E4]"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <Button
          variant="secondary"
          size="sm"
          isLoading={isRefreshing}
          onClick={handleRefresh}
        >
          ↻ Refresh Insights
        </Button>
      </div>

      {refreshMsg && (
        <div className="rounded-[6px] bg-[#0A66C2]/10 border border-[#0A66C2]/20 px-4 py-3 text-[13px] text-[#0A66C2]">
          {refreshMsg}
        </div>
      )}

      {/* List */}
      {isLoading && (
        <>
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-56" />
                  <Skeleton className="h-5 w-20" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </Card>
          ))}
        </>
      )}

      {error && !isLoading && (
        <Card>
          <EmptyState title="Could not load insights" description="AI insight data is unavailable." />
        </Card>
      )}

      {!isLoading && !error && insights.length === 0 && (
        <Card>
          <EmptyState
            title="No insights yet"
            description="AI insights will be generated after your data pipeline runs. Click Refresh Insights to trigger analysis."
            action={{ label: "Refresh Insights", onClick: handleRefresh }}
          />
        </Card>
      )}

      {!isLoading && !error && insights.map((insight) => {
        const isOpen = expanded === insight.id;
        return (
          <div
            key={insight.id}
            className="bg-white rounded-lg border border-[#D9D8D3] border-l-4 border-l-[#7C3AED] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6"
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <h3 className="text-[15px] font-semibold text-[#1A1A1A] leading-snug">
                {insight.title}
              </h3>
              <div className="flex items-center gap-1.5 shrink-0">
                <Badge variant="ai">AI</Badge>
                <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${PRIORITY_COLORS[insight.priority]}`}>
                  {insight.priority.charAt(0).toUpperCase() + insight.priority.slice(1)}
                </span>
              </div>
            </div>

            <p className={`text-[14px] text-[#4A4A4A] leading-relaxed ${!isOpen ? "line-clamp-3" : ""}`}>
              {insight.description}
            </p>

            {isOpen && insight.sourceDataSummary && (
              <div className="mt-4 p-4 bg-[#F3F2EF] rounded-lg border border-[#D9D8D3]">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A] mb-2">
                  Supporting data
                </p>
                <p className="text-[13px] text-[#4A4A4A]">{insight.sourceDataSummary}</p>
              </div>
            )}

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#D9D8D3]">
              <div className="flex items-center gap-4 text-[12px] text-[#8A8A8A]">
                <span>Agent: <span className="text-[#4A4A4A] font-medium">{insight.agentType}</span></span>
                <span>Model: <span className="font-mono text-[#4A4A4A]">{insight.model}</span></span>
                <span title={formatDate(insight.createdAt)}>{formatRelativeTime(insight.createdAt)}</span>
              </div>
              <button
                onClick={() => setExpanded(isOpen ? null : insight.id)}
                className="text-[13px] text-[#0A66C2] hover:text-[#004182] font-medium transition-colors"
              >
                {isOpen ? "Show less" : "Read more"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
