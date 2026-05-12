"use client";

import { useSentimentCharts } from "@/hooks/useSentimentCharts";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

const SOURCE_LABELS: Record<string, string> = {
  nps_survey: "NPS Survey",
  call_centre: "Call Centre",
  social_media: "Social Media",
};

function formatSource(s: string): string {
  return SOURCE_LABELS[s] ?? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function SentimentBySourceChart() {
  const { data, isLoading, error } = useSentimentCharts();
  const sources = (data?.by_source ?? []).slice(0, 8);
  const maxTotal = sources.length > 0 ? Math.max(...sources.map((s) => s.total), 1) : 1;

  return (
    <Card>
      <CardHeader
        title="Sentiment by Channel"
        action={
          sources.length > 0 ? (
            <span className="text-[12px] text-[#8A8A8A]">
              <span className="font-semibold text-[#1A1A1A]">{sources.length}</span> channels
            </span>
          ) : undefined
        }
      />
      <p className="text-[12px] text-[#8A8A8A] -mt-2 mb-4">
        Feedback volume and sentiment split per source channel
      </p>

      {/* Legend */}
      {!isLoading && !error && sources.length > 0 && (
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

      {isLoading && <Skeleton className="h-[240px] w-full" />}

      {error && !isLoading && (
        <EmptyState title="Could not load channel data" description="Channel data unavailable." />
      )}

      {!isLoading && !error && sources.length === 0 && (
        <EmptyState title="No channel data" description="Channel breakdown will appear once feedback is ingested." />
      )}

      {!isLoading && !error && sources.length > 0 && (
        <div className="space-y-4">
          {sources.map((s) => (
            <div key={s.source} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-[#4A4A4A] truncate max-w-[65%]">
                  {formatSource(s.source)}
                </span>
                <span className="text-[12px] font-semibold text-[#1A1A1A]">
                  {s.total.toLocaleString()}
                </span>
              </div>
              <div className="h-2.5 rounded-full bg-[#EAE9E4] overflow-hidden flex">
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${(s.positive / maxTotal) * 100}%`, backgroundColor: "#2D9E6B" }}
                />
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${(s.neutral / maxTotal) * 100}%`, backgroundColor: "#6B7280" }}
                />
                <div
                  className="h-full transition-all duration-500"
                  style={{ width: `${(s.negative / maxTotal) * 100}%`, backgroundColor: "#CC3333" }}
                />
              </div>
              <div className="flex gap-3 text-[10px]">
                <span style={{ color: "#2D9E6B" }}>{s.positive.toLocaleString()} pos</span>
                <span style={{ color: "#6B7280" }}>{s.neutral.toLocaleString()} neu</span>
                <span style={{ color: "#CC3333" }}>{s.negative.toLocaleString()} neg</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
