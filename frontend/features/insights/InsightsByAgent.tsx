"use client";

import { useInsightsSummary } from "@/hooks/useInsightsSummary";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

const BAR_COLORS = ["#7C3AED", "#9B5DE5", "#B07FF0", "#C9A7F5", "#E0D0FA"];

function formatAgent(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function InsightsByAgent() {
  const { data, isLoading, error } = useInsightsSummary();

  const agents = data?.by_agent ?? [];
  const maxTotal = agents.length > 0 ? Math.max(...agents.map((a) => a.total), 1) : 1;

  return (
    <Card>
      <CardHeader
        title="Insights by Agent"
        action={
          agents.length > 0 ? (
            <span className="text-[12px] text-[#8A8A8A]">
              <span className="font-semibold text-[#1A1A1A]">{agents.length}</span> agents
            </span>
          ) : undefined
        }
      />
      <p className="text-[12px] text-[#8A8A8A] -mt-2 mb-4">
        Total AI-generated insights per source agent
      </p>

      {isLoading && <Skeleton className="h-[160px] w-full" />}

      {error && !isLoading && (
        <EmptyState title="Could not load data" description="Agent data unavailable." />
      )}

      {!isLoading && !error && agents.length === 0 && (
        <EmptyState title="No agent data" description="Insights will appear once AI agents run." />
      )}

      {!isLoading && !error && agents.length > 0 && (
        <div className="space-y-3">
          {agents.slice(0, 6).map((agent, idx) => {
            const pct = (agent.total / maxTotal) * 100;
            const color = BAR_COLORS[idx % BAR_COLORS.length];
            return (
              <div key={agent.agent} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-[#4A4A4A] truncate max-w-[65%]">
                    {formatAgent(agent.agent)}
                  </span>
                  <span className="text-[12px] font-semibold text-[#1A1A1A]">{agent.total}</span>
                </div>
                <div className="h-2 rounded-full bg-[#EAE9E4] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${pct}%`, backgroundColor: color }}
                  />
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[#8A8A8A]">
                  <span className="text-[#CC3333]">H:{agent.high}</span>
                  <span className="text-[#E8940A]">M:{agent.medium}</span>
                  <span className="text-[#6B7280]">L:{agent.low}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
