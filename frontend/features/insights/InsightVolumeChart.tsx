"use client";

import { useInsightsSummary } from "@/hooks/useInsightsSummary";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { InsightVolumeWeek } from "@/services/insights.service";

const W = 480;
const H = 140;
const PAD = { top: 14, right: 16, bottom: 28, left: 40 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;

function buildPath(weeks: InsightVolumeWeek[], maxCount: number): string {
  if (weeks.length < 2) return "";
  return weeks
    .map((w, i) => {
      const x = PAD.left + (i / (weeks.length - 1)) * CHART_W;
      const y = PAD.top + (1 - w.total / maxCount) * CHART_H;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function buildArea(weeks: InsightVolumeWeek[], maxCount: number): string {
  const line = buildPath(weeks, maxCount);
  if (!line) return "";
  const x0 = PAD.left.toFixed(1);
  const xN = (PAD.left + CHART_W).toFixed(1);
  const base = (PAD.top + CHART_H).toFixed(1);
  return `${line} L${xN},${base} L${x0},${base} Z`;
}

export function InsightVolumeChart() {
  const { data, isLoading, error } = useInsightsSummary();

  const weeks = data?.volume_by_week ?? [];
  const maxCount = weeks.length > 0 ? Math.max(...weeks.map((w) => w.total), 1) : 1;
  const totalInsights = weeks.reduce((s, w) => s + w.total, 0);

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
        title="Insight Volume Over Time"
        action={
          weeks.length > 0 ? (
            <span className="text-[12px] text-[#8A8A8A]">
              <span className="font-semibold text-[#1A1A1A]">{totalInsights}</span> total (12 wks)
            </span>
          ) : undefined
        }
      />
      <p className="text-[12px] text-[#8A8A8A] -mt-2 mb-3">
        New AI insights generated per week
      </p>

      {isLoading && <Skeleton className="h-[140px] w-full" />}

      {error && !isLoading && (
        <EmptyState title="Could not load data" description="Volume data unavailable." />
      )}

      {!isLoading && !error && weeks.length === 0 && (
        <EmptyState title="No volume data" description="Insight signals will appear here once the AI agent runs." />
      )}

      {!isLoading && !error && weeks.length > 0 && (
        <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
          role="img" aria-label="Insight volume over time">
          <defs>
            <linearGradient id="ivGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#CC3333" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#CC3333" stopOpacity="0" />
            </linearGradient>
          </defs>

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

          {weeks.length === 1 && (
            <rect
              x={PAD.left + CHART_W / 2 - 4}
              y={PAD.top + (1 - weeks[0].total / maxCount) * CHART_H}
              width={8}
              height={(weeks[0].total / maxCount) * CHART_H}
              fill="#CC3333"
              fillOpacity={0.7}
              rx={2}
            />
          )}

          {weeks.length > 1 && <path d={buildArea(weeks, maxCount)} fill="url(#ivGrad)" />}
          {weeks.length > 1 && (
            <path d={buildPath(weeks, maxCount)} fill="none" stroke="#CC3333"
              strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
          )}

          {weeks.map((w, i) => {
            const x = weeks.length > 1
              ? PAD.left + (i / (weeks.length - 1)) * CHART_W
              : PAD.left + CHART_W / 2;
            const y = PAD.top + (1 - w.total / maxCount) * CHART_H;
            return (
              <circle key={w.week} cx={x} cy={y} r={3} fill="#CC3333" stroke="white" strokeWidth={1.5}>
                <title>{w.week}: {w.total} insight{w.total !== 1 ? "s" : ""}</title>
              </circle>
            );
          })}

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
