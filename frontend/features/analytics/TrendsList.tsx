"use client";

import { useState } from "react";
import { useTrends } from "@/hooks/useTrends";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate, formatPercent } from "@/lib/utils";
import type { SignalStrength } from "@/types";

const SIGNAL_VARIANT: Record<SignalStrength, "danger" | "warning" | "neutral"> = {
  high: "danger",
  medium: "warning",
  low: "neutral",
};

const SIGNAL_BAR: Record<SignalStrength, string> = {
  high: "bg-[#CC3333]",
  medium: "bg-[#E8940A]",
  low: "bg-[#6B7280]",
};

const SIGNAL_WIDTH: Record<SignalStrength, string> = {
  high: "w-full",
  medium: "w-2/3",
  low: "w-1/3",
};

export function TrendsList() {
  const { trends, isLoading, error } = useTrends({ limit: 20 });
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {isLoading && (
        <>
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <Skeleton className="h-5 w-48" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            </Card>
          ))}
        </>
      )}

      {error && !isLoading && (
        <Card>
          <EmptyState title="Could not load trends" description="Trend prediction data is unavailable." />
        </Card>
      )}

      {!isLoading && !error && trends.length === 0 && (
        <Card>
          <EmptyState
            title="No trends yet"
            description="Trend predictions will appear after the AI agent processes your sales and behavior data."
          />
        </Card>
      )}

      {!isLoading && !error && trends.map((trend) => {
        const isOpen = expanded === trend.id;
        return (
          <Card key={trend.id}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <h3 className="text-[15px] font-semibold text-[#1A1A1A]">
                    {trend.trendName}
                  </h3>
                  <Badge variant="ai">AI</Badge>
                  <Badge variant={SIGNAL_VARIANT[trend.signalStrength]}>
                    {trend.signalStrength.charAt(0).toUpperCase() + trend.signalStrength.slice(1)} Signal
                  </Badge>
                </div>

                {/* Signal strength bar */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] text-[#8A8A8A] w-14 shrink-0">Strength</span>
                  <div className="flex-1 h-1.5 rounded-full bg-[#EAE9E4] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${SIGNAL_BAR[trend.signalStrength]} ${SIGNAL_WIDTH[trend.signalStrength]}`}
                    />
                  </div>
                  <span className="text-[11px] font-medium text-[#4A4A4A] w-10 text-right">
                    {formatPercent(trend.confidence * 100, 0)}
                  </span>
                </div>

                <p className={`text-[14px] text-[#4A4A4A] leading-relaxed ${!isOpen ? "line-clamp-2" : ""}`}>
                  {trend.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#D9D8D3]">
              <div className="flex items-center gap-4 text-[12px] text-[#8A8A8A]">
                <span>Forecast: <span className="text-[#4A4A4A] font-medium">{trend.forecastPeriod}</span></span>
                <span>Detected: <span className="text-[#4A4A4A] font-medium">{formatDate(trend.createdAt)}</span></span>
              </div>
              <button
                onClick={() => setExpanded(isOpen ? null : trend.id)}
                className="text-[13px] text-[#0A66C2] hover:text-[#004182] font-medium transition-colors"
              >
                {isOpen ? "Show less" : "Read more"}
              </button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
