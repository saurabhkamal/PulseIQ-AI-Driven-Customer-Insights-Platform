"use client";

import { useSegmentEngagement } from "@/hooks/useSegmentEngagement";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

function scoreColor(score: number): string {
  if (score >= 75) return "#2D9E6B";
  if (score >= 40) return "#E8940A";
  return "#CC3333";
}

function scoreBg(score: number): string {
  if (score >= 75) return "#2D9E6B1A";
  if (score >= 40) return "#E8940A1A";
  return "#CC33331A";
}

function formatSegment(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function SegmentEngagementCards() {
  const { data, isLoading, error } = useSegmentEngagement();

  return (
    <Card>
      <CardHeader title="Segment Engagement" />
      <p className="text-[12px] text-[#8A8A8A] -mt-2 mb-4">
        Event activity per customer segment · last 30 days
      </p>

      {isLoading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[90px] rounded-lg" />
          ))}
        </div>
      )}

      {error && !isLoading && (
        <EmptyState title="Could not load segments" description="Segment data is unavailable." />
      )}

      {!isLoading && !error && !data && (
        <EmptyState
          title="No segment data"
          description="Customer segments will appear once customers are tagged with a segment."
        />
      )}

      {!isLoading && !error && data && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {data.map((seg) => {
            const color = scoreColor(seg.engagement_score);
            const bg = scoreBg(seg.engagement_score);
            return (
              <div
                key={seg.segment}
                className="rounded-lg border border-[#D9D8D3] p-3 flex flex-col gap-2"
                style={{ borderLeftColor: color, borderLeftWidth: 3 }}
              >
                <div className="text-[12px] font-semibold text-[#1A1A1A] truncate" title={seg.segment}>
                  {formatSegment(seg.segment)}
                </div>

                {/* Score pill */}
                <div
                  className="inline-flex items-center self-start rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ color, backgroundColor: bg }}
                >
                  {seg.engagement_score}%
                </div>

                {/* Score bar */}
                <div className="h-1.5 rounded-full bg-[#EAE9E4] overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${seg.engagement_score}%`, backgroundColor: color }}
                  />
                </div>

                <div className="text-[11px] text-[#8A8A8A]">
                  {seg.customer_count.toLocaleString()} customers
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
