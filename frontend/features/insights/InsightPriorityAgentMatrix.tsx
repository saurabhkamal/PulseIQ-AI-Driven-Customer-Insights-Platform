"use client";

import { useInsightsSummary } from "@/hooks/useInsightsSummary";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

const PRIORITIES = [
  { key: "high" as const, label: "High", color: "#CC3333" },
  { key: "medium" as const, label: "Medium", color: "#E8940A" },
  { key: "low" as const, label: "Low", color: "#6B7280" },
];

function formatAgent(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function InsightPriorityAgentMatrix() {
  const { data, isLoading, error } = useInsightsSummary();

  const agents = data?.by_agent ?? [];
  const maxTotal = agents.length > 0 ? Math.max(...agents.map((a) => a.total), 1) : 1;

  return (
    <Card>
      <CardHeader title="Priority × Agent Matrix" />
      <p className="text-[12px] text-[#8A8A8A] -mt-2 mb-4">
        Priority breakdown per agent — stacked by urgency
      </p>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-8 w-full" />)}
        </div>
      )}

      {error && !isLoading && (
        <EmptyState title="Could not load data" description="Matrix data unavailable." />
      )}

      {!isLoading && !error && agents.length === 0 && (
        <EmptyState title="No data" description="Insights will appear once AI agents run." />
      )}

      {!isLoading && !error && agents.length > 0 && (
        <div className="space-y-1">
          {/* Legend */}
          <div className="flex items-center gap-4 mb-3">
            {PRIORITIES.map((p) => (
              <div key={p.key} className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: p.color }} />
                <span className="text-[11px] text-[#8A8A8A]">{p.label}</span>
              </div>
            ))}
          </div>

          {/* Rows */}
          {agents.slice(0, 7).map((agent) => {
            const totalPct = (agent.total / maxTotal) * 100;
            const highPct = agent.total > 0 ? (agent.high / agent.total) * totalPct : 0;
            const medPct = agent.total > 0 ? (agent.medium / agent.total) * totalPct : 0;
            const lowPct = agent.total > 0 ? (agent.low / agent.total) * totalPct : 0;

            return (
              <div key={agent.agent} className="grid grid-cols-[140px_1fr_36px] items-center gap-3 py-1">
                <span className="text-[12px] text-[#4A4A4A] truncate" title={agent.agent}>
                  {formatAgent(agent.agent)}
                </span>
                <div className="h-5 flex rounded overflow-hidden bg-[#EAE9E4]">
                  {highPct > 0 && (
                    <div
                      className="h-full transition-all duration-500"
                      style={{ width: `${highPct}%`, backgroundColor: "#CC3333" }}
                      title={`High: ${agent.high}`}
                    />
                  )}
                  {medPct > 0 && (
                    <div
                      className="h-full transition-all duration-500"
                      style={{ width: `${medPct}%`, backgroundColor: "#E8940A" }}
                      title={`Medium: ${agent.medium}`}
                    />
                  )}
                  {lowPct > 0 && (
                    <div
                      className="h-full transition-all duration-500"
                      style={{ width: `${lowPct}%`, backgroundColor: "#6B7280" }}
                      title={`Low: ${agent.low}`}
                    />
                  )}
                </div>
                <span className="text-[12px] font-semibold text-[#1A1A1A] text-right">{agent.total}</span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
