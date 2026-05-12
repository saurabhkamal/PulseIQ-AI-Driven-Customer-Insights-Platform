"use client";

import { useTrendsInsights } from "@/hooks/useTrendsInsights";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

const BAR_COLORS = ["#7C3AED", "#6D28D9", "#5B21B6", "#4C1D95", "#3B0764"];

export function TrendsByCategory() {
  const { data, isLoading, error } = useTrendsInsights();

  const categories = data?.by_category ?? [];
  const max = categories.length > 0 ? categories[0].count : 1;

  return (
    <Card>
      <CardHeader title="Trends by Category" />
      <p className="text-[12px] text-[#8A8A8A] -mt-2 mb-4">
        Active trend count per product category
      </p>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded" />
          ))}
        </div>
      )}

      {error && !isLoading && (
        <EmptyState title="Could not load categories" description="Category data unavailable." />
      )}

      {!isLoading && !error && categories.length === 0 && (
        <EmptyState title="No category data" description="Category labels will appear after trends are generated." />
      )}

      {!isLoading && !error && categories.length > 0 && (
        <div className="space-y-2.5">
          {categories.slice(0, 8).map((item, i) => {
            const barW = (item.count / max) * 100;
            const color = BAR_COLORS[Math.min(i, BAR_COLORS.length - 1)];
            return (
              <div key={item.category}>
                <div className="flex justify-between text-[12px] mb-1">
                  <span className="font-medium text-[#1A1A1A] truncate max-w-[65%]" title={item.category}>
                    {item.category}
                  </span>
                  <span className="font-semibold text-[#4A4A4A]">{item.count}</span>
                </div>
                <div className="h-6 rounded bg-[#EAE9E4] overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-500"
                    style={{ width: `${barW}%`, backgroundColor: color }}
                    role="progressbar"
                    aria-valuenow={item.count}
                    aria-valuemax={max}
                    aria-label={`${item.category}: ${item.count} trends`}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
