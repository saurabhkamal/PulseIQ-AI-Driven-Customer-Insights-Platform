"use client";

import { useInsightsSummary } from "@/hooks/useInsightsSummary";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { InsightVolumeWeek } from "@/services/insights.service";

const W = 480;
const H = 160;
const PAD = { top: 14, right: 16, bottom: 28, left: 40 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;

interface StackLayer {
  key: "high" | "medium" | "low";
  color: string;
  label: string;
  topFn: (w: InsightVolumeWeek) => number;
  botFn: (w: InsightVolumeWeek) => number;
}

const LAYERS: StackLayer[] = [
  {
    key: "high",
    color: "#CC3333",
    label: "High",
    topFn: (w) => w.high,
    botFn: () => 0,
  },
  {
    key: "medium",
    color: "#E8940A",
    label: "Medium",
    topFn: (w) => w.high + w.medium,
    botFn: (w) => w.high,
  },
  {
    key: "low",
    color: "#6B7280",
    label: "Low",
    topFn: (w) => w.total,
    botFn: (w) => w.high + w.medium,
  },
];

function xAt(i: number, n: number): number {
  return PAD.left + (n > 1 ? i / (n - 1) : 0.5) * CHART_W;
}

function yAt(val: number, maxVal: number): number {
  return PAD.top + (1 - val / maxVal) * CHART_H;
}

function buildStackedPath(
  weeks: InsightVolumeWeek[],
  topFn: (w: InsightVolumeWeek) => number,
  botFn: (w: InsightVolumeWeek) => number,
  maxVal: number
): string {
  if (weeks.length === 0) return "";
  const n = weeks.length;
  const forward = weeks
    .map((w, i) => `${i === 0 ? "M" : "L"}${xAt(i, n).toFixed(1)},${yAt(topFn(w), maxVal).toFixed(1)}`)
    .join(" ");
  const backward = [...weeks]
    .reverse()
    .map((w, ri) => {
      const i = n - 1 - ri;
      return `L${xAt(i, n).toFixed(1)},${yAt(botFn(w), maxVal).toFixed(1)}`;
    })
    .join(" ");
  return `${forward} ${backward} Z`;
}

function buildLinePath(
  weeks: InsightVolumeWeek[],
  topFn: (w: InsightVolumeWeek) => number,
  maxVal: number
): string {
  if (weeks.length < 2) return "";
  const n = weeks.length;
  return weeks
    .map((w, i) => `${i === 0 ? "M" : "L"}${xAt(i, n).toFixed(1)},${yAt(topFn(w), maxVal).toFixed(1)}`)
    .join(" ");
}

export function InsightPriorityTrend() {
  const { data, isLoading, error } = useInsightsSummary();

  const weeks = data?.volume_by_week ?? [];
  const maxVal = weeks.length > 0 ? Math.max(...weeks.map((w) => w.total), 1) : 1;

  const yTicks = [0, Math.round(maxVal / 2), maxVal];

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
      <CardHeader title="Priority Trend Over Time" />
      <p className="text-[12px] text-[#8A8A8A] -mt-2 mb-3">
        Weekly insight volume stacked by priority level
      </p>

      {isLoading && <Skeleton className="h-[160px] w-full" />}

      {error && !isLoading && (
        <EmptyState title="Could not load data" description="Trend data unavailable." />
      )}

      {!isLoading && !error && weeks.length === 0 && (
        <EmptyState title="No trend data" description="Priority trends will appear once the AI agent generates insights." />
      )}

      {!isLoading && !error && weeks.length > 0 && (
        <>
          {/* Legend */}
          <div className="flex items-center gap-4 mb-2">
            {LAYERS.map((l) => (
              <div key={l.key} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: l.color }} />
                <span className="text-[11px] text-[#8A8A8A]">{l.label}</span>
              </div>
            ))}
          </div>

          <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
            role="img" aria-label="Priority trend stacked area">
            {/* Gridlines */}
            {yTicks.map((tick) => {
              const y = PAD.top + (1 - tick / maxVal) * CHART_H;
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

            {/* Stacked areas — low first (back), then medium, then high (front) */}
            {[...LAYERS].reverse().map((layer) => (
              <path
                key={layer.key}
                d={buildStackedPath(weeks, layer.topFn, layer.botFn, maxVal)}
                fill={layer.color}
                fillOpacity={0.25}
              />
            ))}

            {/* Top edge lines */}
            {LAYERS.map((layer) => (
              <path
                key={`line-${layer.key}`}
                d={buildLinePath(weeks, layer.topFn, maxVal)}
                fill="none"
                stroke={layer.color}
                strokeWidth={1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}

            {/* X-axis labels */}
            {labelWeeks.map(({ idx, label }) => {
              const n = weeks.length;
              const x = n > 1 ? PAD.left + (idx / (n - 1)) * CHART_W : PAD.left + CHART_W / 2;
              return (
                <text key={label} x={x} y={H - 6} textAnchor="middle"
                  fontSize={10} fill="#8A8A8A" fontFamily="system-ui, sans-serif">
                  {label}
                </text>
              );
            })}
          </svg>
        </>
      )}
    </Card>
  );
}
