"use client";

import { useSentimentCharts } from "@/hooks/useSentimentCharts";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

export function SentimentByProductChart() {
  const { data, isLoading, error } = useSentimentCharts();
  const products = (data?.by_product ?? []).slice(0, 8);
  const maxTotal = products.length > 0 ? Math.max(...products.map((p) => p.total), 1) : 1;

  return (
    <Card>
      <CardHeader
        title="Sentiment by Product"
        action={
          products.length > 0 ? (
            <span className="text-[12px] text-[#8A8A8A]">
              <span className="font-semibold text-[#1A1A1A]">{products.length}</span> products
            </span>
          ) : undefined
        }
      />
      <p className="text-[12px] text-[#8A8A8A] -mt-2 mb-4">
        Feedback volume and sentiment split per product line
      </p>

      {/* Legend */}
      {!isLoading && !error && products.length > 0 && (
        <div className="flex items-center gap-4 mb-4">
          {[
            { color: "#2D9E6B", label: "Positive" },
            { color: "#6B7280", label: "Neutral" },
            { color: "#CC3333", label: "Negative" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: color }} />
              <span className="text-[11px] text-[#8A8A8A]">{label}</span>
            </div>
          ))}
        </div>
      )}

      {isLoading && (
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      )}

      {error && !isLoading && (
        <EmptyState title="Could not load product data" description="Product data unavailable." />
      )}

      {!isLoading && !error && products.length === 0 && (
        <EmptyState title="No product data" description="Link feedback to products to see per-product sentiment." />
      )}

      {!isLoading && !error && products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {products.map((p) => (
            <div key={p.product} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#4A4A4A] truncate max-w-[70%]" title={p.product}>
                  {p.product}
                </span>
                <span className="text-[12px] font-semibold text-[#1A1A1A]">
                  {p.total.toLocaleString()}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-[#EAE9E4] overflow-hidden flex">
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${(p.positive / maxTotal) * 100}%`, backgroundColor: "#2D9E6B" }}
                />
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${(p.neutral / maxTotal) * 100}%`, backgroundColor: "#6B7280" }}
                />
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${(p.negative / maxTotal) * 100}%`, backgroundColor: "#CC3333" }}
                />
              </div>
              <div className="flex gap-3 text-[10px]">
                <span style={{ color: "#2D9E6B" }}>{p.positive.toLocaleString()} pos</span>
                <span style={{ color: "#6B7280" }}>{p.neutral.toLocaleString()} neu</span>
                <span style={{ color: "#CC3333" }}>{p.negative.toLocaleString()} neg</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
