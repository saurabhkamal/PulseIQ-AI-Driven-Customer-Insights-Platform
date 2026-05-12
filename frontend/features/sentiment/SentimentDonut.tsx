"use client";

import { useSentimentSummary } from "@/hooks/useSentimentSummary";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

const SENTIMENT_CONFIG = [
  { key: "positive" as const, label: "Positive", color: "#2D9E6B" },
  { key: "neutral"  as const, label: "Neutral",  color: "#6B7280" },
  { key: "negative" as const, label: "Negative", color: "#CC3333" },
];

const CX = 80;
const CY = 80;
const R = 62;
const INNER_R = 40;
const GAP = 0.02;

function describeArc(cx: number, cy: number, r: number, s: number, e: number): string {
  const sx = cx + r * Math.cos(s);
  const sy = cy + r * Math.sin(s);
  const ex = cx + r * Math.cos(e);
  const ey = cy + r * Math.sin(e);
  return `M${sx.toFixed(2)},${sy.toFixed(2)} A${r},${r} 0 ${e - s > Math.PI ? 1 : 0},1 ${ex.toFixed(2)},${ey.toFixed(2)}`;
}

function buildDonutPath(cx: number, cy: number, r: number, ir: number, s: number, e: number): string {
  const outer = describeArc(cx, cy, r, s, e);
  const isx = cx + ir * Math.cos(e);
  const isy = cy + ir * Math.sin(e);
  const iex = cx + ir * Math.cos(s);
  const iey = cy + ir * Math.sin(s);
  const large = e - s > Math.PI ? 1 : 0;
  return `${outer} L${isx.toFixed(2)},${isy.toFixed(2)} A${ir},${ir} 0 ${large},0 ${iex.toFixed(2)},${iey.toFixed(2)} Z`;
}

export function SentimentDonut() {
  const { summary, isLoading, error } = useSentimentSummary();
  const total = summary?.total ?? 0;

  const slices: Array<{
    config: typeof SENTIMENT_CONFIG[number];
    startAngle: number;
    endAngle: number;
  }> = [];

  if (total > 0 && summary) {
    let angle = -Math.PI / 2;
    for (const cfg of SENTIMENT_CONFIG) {
      const count = summary[cfg.key];
      if (count === 0) continue;
      const sweep = (count / total) * (2 * Math.PI) - GAP;
      slices.push({ config: cfg, startAngle: angle + GAP / 2, endAngle: angle + GAP / 2 + sweep });
      angle += (count / total) * (2 * Math.PI);
    }
  }

  return (
    <Card>
      <CardHeader title="Sentiment Distribution" />
      <p className="text-[12px] text-[#8A8A8A] -mt-2 mb-4">
        Proportion of positive, neutral, and negative feedback
      </p>

      {isLoading && <Skeleton className="h-[160px] w-full" />}

      {error && !isLoading && (
        <EmptyState title="Could not load data" description="Distribution data unavailable." />
      )}

      {!isLoading && !error && total === 0 && (
        <EmptyState title="No sentiment data" description="Sentiment results will appear after feedback is processed." />
      )}

      {!isLoading && !error && total > 0 && summary && (
        <div className="flex items-center gap-6">
          <svg width="160" height="160" viewBox="0 0 160 160" role="img" aria-label="Sentiment distribution donut">
            {slices.map(({ config, startAngle, endAngle }) => (
              <path
                key={config.key}
                d={buildDonutPath(CX, CY, R, INNER_R, startAngle, endAngle)}
                fill={config.color}
                opacity={0.9}
              >
                <title>{config.label}: {summary[config.key].toLocaleString()}</title>
              </path>
            ))}
            <text x={CX} y={CY - 8} textAnchor="middle" fontSize={20} fontWeight="700"
              fill="#1A1A1A" fontFamily="system-ui, sans-serif">
              {total.toLocaleString()}
            </text>
            <text x={CX} y={CY + 10} textAnchor="middle" fontSize={10}
              fill="#8A8A8A" fontFamily="system-ui, sans-serif">
              reviews
            </text>
          </svg>

          <div className="flex flex-col gap-3 flex-1">
            {SENTIMENT_CONFIG.map((cfg) => {
              const count = summary[cfg.key];
              const pct = Math.round((count / total) * 100);
              return (
                <div key={cfg.key} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: cfg.color }} />
                  <span className="text-[13px] text-[#4A4A4A] flex-1">{cfg.label}</span>
                  <span className="text-[13px] font-semibold text-[#1A1A1A]">{count.toLocaleString()}</span>
                  <span className="text-[11px] text-[#8A8A8A] w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
