"use client";

import Link from "next/link";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

function fmtGbp(v: number): string {
  if (v >= 1_000_000) return `£${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `£${(v / 1_000).toFixed(0)}K`;
  return `£${v.toFixed(0)}`;
}

const BAR_COLORS = ["#0A66C2", "#2D9E6B", "#7C3AED", "#E8940A", "#6B7280"];

export function TopProductsWidget() {
  const { data, isLoading, error } = useDashboardSummary();

  if (isLoading) {
    return (
      <div className="bg-white border border-[#D9D8D3] rounded-xl p-5 shadow-sm">
        <Skeleton className="h-4 w-40 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-3 w-24 flex-shrink-0" />
              <Skeleton className="h-3 flex-1" />
              <Skeleton className="h-3 w-14 flex-shrink-0" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-[#D9D8D3] rounded-xl p-5 shadow-sm">
        <EmptyState title="Products unavailable" description="Could not load top products." />
      </div>
    );
  }

  const products = data.top_products;
  const maxRevenue = Math.max(...products.map((p) => p.revenue), 1);

  if (products.length === 0) {
    return (
      <div className="bg-white border border-[#D9D8D3] rounded-xl p-5 shadow-sm">
        <EmptyState title="No products" description="Product revenue data will appear once sales are ingested." />
      </div>
    );
  }

  return (
    <div className="bg-white border border-[#D9D8D3] rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[15px] font-semibold text-[#1A1A1A]">Top Products</h3>
          <p className="text-[12px] text-[#8A8A8A] mt-0.5">By revenue — last 30 days</p>
        </div>
        <Link
          href="/analytics/behavior"
          className="text-[12px] text-[#0A66C2] hover:text-[#004182] font-medium transition-colors"
        >
          Analytics →
        </Link>
      </div>

      <div className="space-y-3">
        {products.map((product, idx) => {
          const barPct = (product.revenue / maxRevenue) * 100;
          const color = BAR_COLORS[idx] ?? "#6B7280";
          return (
            <div key={product.id} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="text-[11px] font-bold text-white w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: color }}
                    aria-hidden="true"
                  >
                    {idx + 1}
                  </span>
                  <span className="text-[13px] text-[#1A1A1A] truncate font-medium">{product.name}</span>
                </div>
                <span className="text-[13px] font-semibold text-[#1A1A1A] flex-shrink-0 ml-2" style={{ color }}>
                  {fmtGbp(product.revenue)}
                </span>
              </div>
              <div className="h-2 rounded-full bg-[#EAE9E4] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${barPct}%`, backgroundColor: color }}
                  role="progressbar"
                  aria-valuenow={Math.round(barPct)}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`${product.name}: ${fmtGbp(product.revenue)}`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
