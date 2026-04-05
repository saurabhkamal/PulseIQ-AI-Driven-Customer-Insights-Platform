"use client";

import { useKpiMetrics } from "@/hooks/useKpiMetrics";
import { KpiCard } from "./KpiCard";
import { KpiCardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

export function KpiGrid() {
  const { metrics, isLoading, error } = useKpiMetrics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <KpiCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg border border-[#D9D8D3] p-6">
        <EmptyState
          title="Could not load metrics"
          description="There was a problem fetching your KPI data. Please try again."
          action={{ label: "Retry", onClick: () => window.location.reload() }}
        />
      </div>
    );
  }

  if (!metrics || metrics.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-[#D9D8D3] p-6">
        <EmptyState
          title="No metrics available"
          description="KPI data will appear here once your data sources are connected."
        />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
      {metrics.map((metric) => (
        <KpiCard key={metric.id} metric={metric} />
      ))}
    </div>
  );
}
