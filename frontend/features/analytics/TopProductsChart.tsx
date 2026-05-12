"use client";

import { useTopProducts } from "@/hooks/useTopProducts";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

function formatRevenue(value: number): string {
  if (value >= 1_000_000) return `£${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `£${(value / 1_000).toFixed(1)}K`;
  return `£${value.toFixed(0)}`;
}

export function TopProductsChart() {
  const { data, isLoading, error } = useTopProducts();

  const maxRevenue = data ? Math.max(...data.map((p) => p.revenue)) : 0;

  return (
    <Card>
      <CardHeader title="Top Products by Revenue" />
      <p className="text-[12px] text-[#8A8A8A] -mt-2 mb-4">Last 30 days</p>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full rounded" />
          ))}
        </div>
      )}

      {error && !isLoading && (
        <EmptyState title="Could not load products" description="Product revenue data is unavailable." />
      )}

      {!isLoading && !error && !data && (
        <EmptyState
          title="No product data"
          description="Connect a data source to see top products by revenue."
        />
      )}

      {!isLoading && !error && data && (
        <div className="space-y-3">
          {data.map((product, i) => {
            const barWidth = maxRevenue > 0 ? (product.revenue / maxRevenue) * 100 : 0;
            const COLORS = [
              "#0A66C2",
              "#1D4ED8",
              "#2563EB",
              "#3B82F6",
              "#60A5FA",
            ];
            const color = COLORS[i % COLORS.length];
            return (
              <div key={product.id}>
                <div className="flex justify-between items-baseline text-[13px] mb-1">
                  <span
                    className="font-medium text-[#1A1A1A] truncate max-w-[55%]"
                    title={product.name}
                  >
                    {product.name}
                  </span>
                  <div className="flex items-center gap-3 text-[#8A8A8A] shrink-0">
                    <span className="text-[#4A4A4A] font-semibold">
                      {formatRevenue(product.revenue)}
                    </span>
                    <span className="text-[11px]">{product.units.toLocaleString()} units</span>
                  </div>
                </div>
                <div className="h-7 rounded bg-[#EAE9E4] overflow-hidden">
                  <div
                    className="h-full rounded flex items-center px-2 transition-all duration-500"
                    style={{ width: `${barWidth}%`, backgroundColor: color }}
                    role="progressbar"
                    aria-valuenow={Math.round(barWidth)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${product.name}: ${formatRevenue(product.revenue)}`}
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
