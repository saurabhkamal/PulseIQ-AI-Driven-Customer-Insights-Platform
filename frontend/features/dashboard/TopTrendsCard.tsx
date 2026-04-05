"use client";

import Link from "next/link";
import { useTrends } from "@/hooks/useTrends";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { SignalStrength } from "@/types";

const SIGNAL_VARIANT: Record<SignalStrength, "danger" | "warning" | "neutral"> = {
  high: "danger",
  medium: "warning",
  low: "neutral",
};

export function TopTrendsCard() {
  const { trends, isLoading, error } = useTrends({ limit: 4 });

  return (
    <Card>
      <CardHeader
        title="Emerging Trends"
        action={
          <Link
            href="/analytics/trends"
            className="text-[13px] text-[#0A66C2] hover:text-[#004182] font-medium transition-colors"
          >
            View all
          </Link>
        }
      />

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      )}

      {error && !isLoading && (
        <EmptyState title="Could not load" description="Trend data unavailable." />
      )}

      {!isLoading && !error && trends.length === 0 && (
        <EmptyState title="No trends yet" description="Trend predictions will appear after analysis runs." />
      )}

      {!isLoading && !error && trends.length > 0 && (
        <ul className="space-y-3">
          {trends.map((trend) => (
            <li key={trend.id} className="flex items-center justify-between gap-3">
              <span className="text-[13px] text-[#1A1A1A] font-medium truncate">
                {trend.trendName}
              </span>
              <Badge variant={SIGNAL_VARIANT[trend.signalStrength]}>
                {trend.signalStrength.charAt(0).toUpperCase() + trend.signalStrength.slice(1)}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
