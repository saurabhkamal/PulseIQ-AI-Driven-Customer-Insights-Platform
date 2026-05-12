"use client";

import { useTrendsInsights } from "@/hooks/useTrendsInsights";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { VolumeWeek } from "@/services/trends.service";

const W = 480;
const H = 140;
const PAD = { top: 14, right: 16, bottom: 28, left: 40 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;

function buildPath(weeks: VolumeWeek[], maxCount: number): string {
  if (weeks.length < 2) return "";
  return weeks
    .map((w, i) => {
      const x = PAD.left + (i / (weeks.length - 1)) * CHART_W;
      const y = PAD.top + (1 - w.count / maxCount) * CHART_H;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function buildArea(weeks: VolumeWeek[], maxCount: number): string {
  const line = buildPath(weeks, maxCount);
  if (!line) return "";
  const x0 = PAD.left.toFixed(1);
  const xN = (PAD.left + CHART_W).toFixed(1);
  const base = (PAD.top + CHART_H).toFixed(1);
  return `${line} L${xN},${base} L${x0},${base} Z`;
}

export function TrendVolumeChart() {
  const { data, isLoading, error } = useTrendsInsights();

  const weeks = data?.volume_by_week ?? [];
  const maxCount = weeks.length > 0 ? Math.max(...weeks.map((w) => w.count), 1) : 1;
  const totalTrends = weeks.reduce((s, w) => s + w.count, 0);

  const yTicks = [0, Math.round(maxCount / 2), maxCount];

  const labelWeeks =
    weeks.length > 1
      ? [0, Math.floor(weeks.length / 2), weeks.length - 1].map((idx) => ({
          idx,
          label: (() => {
            const parts = weeks[idx].week.split("-");
            return `${parts[1]}/${parts[2]}`;
          })(),
        }))
      : [];

  return (
    <Card>
      <CardHeader
        title="Trend Volume Over Time"
        action={
          weeks.length > 0 ? (
            <span className="text-[12px] text-[#8A8A8A]">
              <span className="font-semibold text-[#1A1A1A]">{totalTrends}</span> total (12 wks)
            </span>
          ) : undefined
        }
      />
      <p className="text-[12px] text-[#8A8A8A] -mt-2 mb-3">
        New AI trend signals detected per week
      </p>

      {isLoading && <Skeleton className="h-[140px] w-full" />}

      {error && !isLoading && (
        <EmptyState title="Could not load volume data" description="Volume data unavailable." />
      )}

      {!isLoading && !error && weeks.length === 0 && (
        <EmptyState title="No volume data" description="Trend signals will appear here once the AI agent runs." />
      )}

      {!isLoading && !error && weeks.length > 0 && (
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
          role="img" aria-label="Trend volume over time">
          <defs>
            <linearGradient id="tvGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Gridlines + Y labels */}
          {yTicks.map((tick) => {
            const y = PAD.top + (1 - tick / maxCount) * CHART_H;
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

          {/* Data points bar fill for single point */}
          {weeks.length === 1 && (
            <rect
              x={PAD.left + CHART_W / 2 - 4}
              y={PAD.top + (1 - weeks[0].count / maxCount) * CHART_H}
              width={8}
              height={(weeks[0].count / maxCount) * CHART_H}
              fill="#7C3AED"
              fillOpacity={0.7}
              rx={2}
            />
          )}

          {/* Area */}
          {weeks.length > 1 && <path d={buildArea(weeks, maxCount)} fill="url(#tvGrad)" />}

          {/* Line */}
          {weeks.length > 1 && (
            <path d={buildPath(weeks, maxCount)} fill="none" stroke="#7C3AED"
              strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          )}

          {/* Dots */}
          {weeks.map((w, i) => {
            const x = weeks.length > 1
              ? PAD.left + (i / (weeks.length - 1)) * CHART_W
              : PAD.left + CHART_W / 2;
            const y = PAD.top + (1 - w.count / maxCount) * CHART_H;
            return (
              <circle key={w.week} cx={x} cy={y} r={3} fill="#7C3AED" stroke="white" strokeWidth={1.5}>
                <title>{w.week}: {w.count} trend{w.count !== 1 ? "s" : ""}</title>
              </circle>
            );
          })}

          {/* X-axis date labels */}
          {labelWeeks.map(({ idx, label }) => {
            const x =
              weeks.length > 1
                ? PAD.left + (idx / (weeks.length - 1)) * CHART_W
                : PAD.left + CHART_W / 2;
            return (
              <text key={label} x={x} y={H - 6} textAnchor="middle"
                fontSize={10} fill="#8A8A8A" fontFamily="system-ui, sans-serif">
                {label}
              </text>
            );
          })}
        </svg>
      )}
    </Card>
  );
}
