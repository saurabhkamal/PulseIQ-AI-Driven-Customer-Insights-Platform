"use client";

import { useDauTrend } from "@/hooks/useDauTrend";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { DauDay } from "@/services/analytics.service";

const W = 480;
const H = 140;
const PAD = { top: 12, right: 16, bottom: 28, left: 44 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;

function buildPath(days: DauDay[], maxCount: number): string {
  if (days.length === 0) return "";
  return days
    .map((d, i) => {
      const x = PAD.left + (i / Math.max(days.length - 1, 1)) * CHART_W;
      const y = PAD.top + (1 - d.count / Math.max(maxCount, 1)) * CHART_H;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function buildArea(days: DauDay[], maxCount: number): string {
  if (days.length === 0) return "";
  const linePath = buildPath(days, maxCount);
  const lastX = (PAD.left + CHART_W).toFixed(1);
  const firstX = PAD.left.toFixed(1);
  const baseY = (PAD.top + CHART_H).toFixed(1);
  return `${linePath} L${lastX},${baseY} L${firstX},${baseY} Z`;
}

export function DauTrendChart() {
  const { data, isLoading, error } = useDauTrend();

  const maxCount = data ? Math.max(...data.map((d) => d.count), 1) : 1;
  const totalDau = data ? data.reduce((s, d) => s + d.count, 0) : 0;
  const avgDau = data && data.length > 0 ? Math.round(totalDau / data.length) : 0;

  const yTicks = [0, Math.round(maxCount / 2), maxCount];

  const labelDates: { x: number; label: string }[] = [];
  if (data && data.length > 1) {
    const indices = [0, Math.floor(data.length / 2), data.length - 1];
    indices.forEach((idx) => {
      const d = data[idx];
      const x = PAD.left + (idx / Math.max(data.length - 1, 1)) * CHART_W;
      const parts = d.date.split("-");
      labelDates.push({ x, label: `${parts[1]}/${parts[2]}` });
    });
  }

  return (
    <Card>
      <CardHeader
        title="Daily Active Users"
        action={
          data ? (
            <span className="text-[12px] text-[#8A8A8A]">
              Avg <span className="font-semibold text-[#1A1A1A]">{avgDau.toLocaleString()}</span>/day
            </span>
          ) : undefined
        }
      />
      <p className="text-[12px] text-[#8A8A8A] -mt-2 mb-4">Distinct active customers · last 30 days</p>

      {isLoading && <Skeleton className="h-[140px] w-full" />}

      {error && !isLoading && (
        <EmptyState title="Could not load DAU data" description="Active user data is unavailable." />
      )}

      {!isLoading && !error && !data && (
        <EmptyState
          title="No activity data"
          description="Customer events will populate this chart once data is ingested."
        />
      )}

      {!isLoading && !error && data && (
        <svg
          width="100%"
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          role="img"
          aria-label="Daily active users trend"
        >
          <defs>
            <linearGradient id="dauGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0A66C2" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0A66C2" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Y-axis gridlines + labels */}
          {yTicks.map((tick) => {
            const y = PAD.top + (1 - tick / maxCount) * CHART_H;
            return (
              <g key={tick}>
                <line
                  x1={PAD.left}
                  y1={y}
                  x2={PAD.left + CHART_W}
                  y2={y}
                  stroke="#EAE9E4"
                  strokeWidth={1}
                />
                <text
                  x={PAD.left - 6}
                  y={y}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize={10}
                  fill="#8A8A8A"
                  fontFamily="system-ui, sans-serif"
                >
                  {tick >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={buildArea(data, maxCount)} fill="url(#dauGrad)" />

          {/* Line */}
          <path
            d={buildPath(data, maxCount)}
            fill="none"
            stroke="#0A66C2"
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* X-axis date labels */}
          {labelDates.map(({ x, label }) => (
            <text
              key={label}
              x={x}
              y={H - 6}
              textAnchor="middle"
              fontSize={10}
              fill="#8A8A8A"
              fontFamily="system-ui, sans-serif"
            >
              {label}
            </text>
          ))}
        </svg>
      )}
    </Card>
  );
}
