"use client";

import { useSentimentCharts } from "@/hooks/useSentimentCharts";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { SentimentWeek } from "@/services/sentiment.service";

const W = 480;
const H = 160;
const PAD = { top: 14, right: 16, bottom: 28, left: 44 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;

const SERIES = [
  { key: "positive" as const, color: "#2D9E6B", gradId: "sentPosGrad", label: "Positive" },
  { key: "neutral"  as const, color: "#6B7280", gradId: "sentNeuGrad", label: "Neutral" },
  { key: "negative" as const, color: "#CC3333", gradId: "sentNegGrad", label: "Negative" },
];

function xAt(i: number, n: number): number {
  return PAD.left + (i / Math.max(n - 1, 1)) * CHART_W;
}

function yAt(val: number, maxVal: number): number {
  return PAD.top + (1 - val / maxVal) * CHART_H;
}

function buildPath(weeks: SentimentWeek[], key: "positive" | "neutral" | "negative", maxVal: number): string {
  if (weeks.length === 0) return "";
  return weeks
    .map((w, i) => `${i === 0 ? "M" : "L"}${xAt(i, weeks.length).toFixed(1)},${yAt(w[key], maxVal).toFixed(1)}`)
    .join(" ");
}

function buildArea(weeks: SentimentWeek[], key: "positive" | "neutral" | "negative", maxVal: number): string {
  const line = buildPath(weeks, key, maxVal);
  if (!line) return "";
  const x0 = PAD.left.toFixed(1);
  const xN = (PAD.left + CHART_W).toFixed(1);
  const base = (PAD.top + CHART_H).toFixed(1);
  return `${line} L${xN},${base} L${x0},${base} Z`;
}

export function SentimentTrendChart() {
  const { data, isLoading, error } = useSentimentCharts();
  const weeks = data?.weekly_trend ?? [];

  const maxCount = weeks.length > 0
    ? Math.max(...weeks.flatMap((w) => [w.positive, w.neutral, w.negative]), 1)
    : 1;

  const yTicks = [0, Math.round(maxCount / 2), maxCount];

  const labelWeeks = weeks.length > 1
    ? [0, Math.floor(weeks.length / 2), weeks.length - 1].map((idx) => {
        const parts = weeks[idx].week.split("-");
        return { x: xAt(idx, weeks.length), label: `${parts[1]}/${parts[2]}` };
      })
    : [];

  return (
    <Card>
      <CardHeader title="Sentiment Trend" />
      <p className="text-[12px] text-[#8A8A8A] -mt-2 mb-3">
        Weekly positive, neutral, and negative signals · last 12 weeks
      </p>

      {isLoading && <Skeleton className="h-[160px] w-full" />}

      {error && !isLoading && (
        <EmptyState title="Could not load trend" description="Trend data unavailable." />
      )}

      {!isLoading && !error && weeks.length === 0 && (
        <EmptyState title="No trend data" description="Sentiment trends will appear once feedback is processed." />
      )}

      {!isLoading && !error && weeks.length > 0 && (
        <>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
            role="img" aria-label="Sentiment trend over time">
            <defs>
              {SERIES.map(({ gradId, color }) => (
                <linearGradient key={gradId} id={gradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity="0.18" />
                  <stop offset="100%" stopColor={color} stopOpacity="0" />
                </linearGradient>
              ))}
            </defs>

            {/* Y-axis gridlines */}
            {yTicks.map((tick) => {
              const y = yAt(tick, maxCount);
              return (
                <g key={tick}>
                  <line x1={PAD.left} y1={y} x2={PAD.left + CHART_W} y2={y}
                    stroke="#EAE9E4" strokeWidth={1} />
                  <text x={PAD.left - 6} y={y} textAnchor="end" dominantBaseline="middle"
                    fontSize={10} fill="#8A8A8A" fontFamily="system-ui, sans-serif">
                    {tick}
                  </text>
                </g>
              );
            })}

            {/* Area fills — render back to front */}
            {[...SERIES].reverse().map(({ key, gradId }) => (
              <path key={`area-${key}`}
                d={buildArea(weeks, key, maxCount)}
                fill={`url(#${gradId})`}
              />
            ))}

            {/* Lines */}
            {SERIES.map(({ key, color }) => (
              <path key={`line-${key}`}
                d={buildPath(weeks, key, maxCount)}
                fill="none"
                stroke={color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}

            {/* Dots */}
            {SERIES.map(({ key, color }) =>
              weeks.map((w, i) => (
                <circle
                  key={`${key}-${w.week}`}
                  cx={xAt(i, weeks.length)}
                  cy={yAt(w[key], maxCount)}
                  r={2.5}
                  fill={color}
                  stroke="white"
                  strokeWidth={1}
                >
                  <title>{w.week} — {key}: {w[key]}</title>
                </circle>
              ))
            )}

            {/* X-axis labels */}
            {labelWeeks.map(({ x, label }) => (
              <text key={label} x={x} y={H - 6} textAnchor="middle"
                fontSize={10} fill="#8A8A8A" fontFamily="system-ui, sans-serif">
                {label}
              </text>
            ))}
          </svg>

          {/* Legend */}
          <div className="flex items-center gap-5 mt-2">
            {SERIES.map(({ key, color, label }) => (
              <span key={key} className="flex items-center gap-1.5 text-[11px] text-[#4A4A4A]">
                <span className="inline-block w-5 rounded" style={{ height: 2, backgroundColor: color }} />
                {label}
              </span>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
