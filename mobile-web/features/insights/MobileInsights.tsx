"use client";

import { useState } from "react";
import { MobileShell } from "@/components/layout/MobileShell";
import { useInsights } from "@/hooks/useInsights";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PRIORITY_COLORS } from "@/lib/utils";
import { formatRelativeTime } from "@/lib/utils";
import type { InsightPriority } from "@/types";

const PRIORITY_VARIANT: Record<InsightPriority, "danger" | "warning" | "neutral"> = {
  high: "danger",
  medium: "warning",
  low: "neutral",
};

const FILTER_OPTIONS: { label: string; value: InsightPriority | "all" }[] = [
  { label: "All", value: "all" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

export function MobileInsights() {
  const { insights, isLoading, error } = useInsights(20);
  const [filter, setFilter] = useState<InsightPriority | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = filter === "all" ? insights : insights.filter((i) => i.priority === filter);

  return (
    <MobileShell title="AI Insights">
      {/* Priority filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors min-h-[36px] ${
              filter === opt.value
                ? "bg-[#0A66C2] text-white"
                : "bg-white border border-[#D9D8D3] text-[#4A4A4A]"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-[#D9D8D3]">
              <div className="flex items-start justify-between gap-2 mb-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-3 w-full mb-1" />
              <Skeleton className="h-3 w-4/5" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white rounded-xl p-5 border border-[#D9D8D3] text-center text-[13px] text-[#CC3333]">
          Failed to load insights. Please try again.
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No insights yet"
          description={
            filter === "all"
              ? "Connect a data source to generate AI insights."
              : `No ${filter} priority insights at this time.`
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((insight) => {
            const isExpanded = expandedId === insight.id;
            return (
              <button
                key={insight.id}
                onClick={() => setExpandedId(isExpanded ? null : insight.id)}
                className="w-full text-left bg-white rounded-xl border-l-4 border border-[#D9D8D3] shadow-[0_1px_3px_rgba(0,0,0,0.06)] p-4 transition-shadow active:shadow-none"
                style={{ borderLeftColor: "#7C3AED" }}
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <p className="text-[14px] font-semibold text-[#1A1A1A] leading-snug">
                    {insight.title}
                  </p>
                  <Badge variant="ai" className="shrink-0">AI</Badge>
                </div>

                {/* Priority + timestamp */}
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORITY_COLORS[insight.priority]}`}
                  >
                    {insight.priority.charAt(0).toUpperCase() + insight.priority.slice(1)} Priority
                  </span>
                  <span className="text-[11px] text-[#8A8A8A]">
                    {formatRelativeTime(insight.createdAt)}
                  </span>
                </div>

                {/* Description — always visible first line, expand for full */}
                <p
                  className={`text-[13px] text-[#4A4A4A] leading-relaxed ${
                    isExpanded ? "" : "line-clamp-2"
                  }`}
                >
                  {insight.description}
                </p>

                {/* Expanded provenance */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-[#D9D8D3] flex flex-wrap gap-2">
                    <Badge variant={PRIORITY_VARIANT[insight.priority]}>
                      {insight.priority}
                    </Badge>
                    <span className="text-[11px] text-[#8A8A8A]">Agent: {insight.agentType}</span>
                    <span className="text-[11px] text-[#8A8A8A]">Model: {insight.model}</span>
                  </div>
                )}

                {/* Expand chevron */}
                <p className="text-[11px] text-[#0A66C2] mt-2">
                  {isExpanded ? "Show less ↑" : "Show more ↓"}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </MobileShell>
  );
}
