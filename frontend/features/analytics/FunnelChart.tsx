"use client";

import { useFunnel } from "@/hooks/useFunnel";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPercent } from "@/lib/utils";

export function FunnelChart() {
  const { data, isLoading, error } = useFunnel();

  return (
    <Card>
      <CardHeader title="Conversion Funnel" />

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className={`h-10 rounded ${i === 0 ? "w-full" : i === 1 ? "w-5/6" : i === 2 ? "w-4/6" : "w-3/6"}`} />
          ))}
        </div>
      )}

      {error && !isLoading && (
        <EmptyState title="Could not load funnel" description="Funnel data is unavailable." />
      )}

      {!isLoading && !error && !data && (
        <EmptyState title="No funnel data" description="Connect a data source to see your conversion funnel." />
      )}

      {!isLoading && !error && data && (
        <div className="space-y-3">
          {data.steps.map((step, i) => {
            const widthPct = i === 0 ? 100 : (step.count / data.steps[0].count) * 100;
            return (
              <div key={step.step}>
                <div className="flex justify-between text-[13px] mb-1">
                  <span className="font-medium text-[#1A1A1A]">{step.step}</span>
                  <div className="flex items-center gap-3 text-[#8A8A8A]">
                    <span>{step.count.toLocaleString()}</span>
                    {i > 0 && (
                      <span className="text-[#CC3333] font-medium">
                        {formatPercent(step.conversionRate)} conv.
                      </span>
                    )}
                  </div>
                </div>
                <div className="h-9 rounded bg-[#EAE9E4] overflow-hidden">
                  <div
                    className="h-full rounded bg-[#0A66C2] flex items-center px-3 transition-all duration-500"
                    style={{ width: `${widthPct}%` }}
                    role="progressbar"
                    aria-valuenow={Math.round(widthPct)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${step.step}: ${widthPct.toFixed(0)}%`}
                  >
                    <span className="text-white text-[12px] font-medium truncate">
                      {formatPercent(widthPct, 0)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          <p className="text-[12px] text-[#8A8A8A] pt-2 border-t border-[#D9D8D3]">
            Overall conversion:{" "}
            <span className="font-semibold text-[#2D9E6B]">
              {formatPercent(data.overallConversion)}
            </span>
          </p>
        </div>
      )}
    </Card>
  );
}
