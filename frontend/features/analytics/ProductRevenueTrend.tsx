"use client";

import { useProductRevenueTrend } from "@/hooks/useProductRevenueTrend";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ProductRevenueSeries } from "@/services/analytics.service";

const W = 480;
const H = 160;
const PAD = { top: 12, right: 16, bottom: 28, left: 52 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;

const SERIES_COLORS = ["#0A66C2", "#2D9E6B", "#E8940A", "#7C3AED", "#CC3333"];

function buildLinePath(
  series: ProductRevenueSeries,
  allDates: string[],
  maxRevenue: number
): string {
  const dateIndex = new Map(allDates.map((d, i) => [d, i]));
  const points = series.days
    .map((d) => {
      const idx = dateIndex.get(d.date);
      if (idx === undefined) return null;
      const x = PAD.left + (idx / Math.max(allDates.length - 1, 1)) * CHART_W;
      const y = PAD.top + (1 - d.revenue / maxRevenue) * CHART_H;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .filter(Boolean);

  if (points.length === 0) return "";
  return points.map((p, i) => `${i === 0 ? "M" : "L"}${p}`).join(" ");
}

export function ProductRevenueTrend() {
  const { data, isLoading, error } = useProductRevenueTrend();

  const allDates = data
    ? Array.from(
        new Set(data.flatMap((s) => s.days.map((d) => d.date)))
      ).sort()
    : [];

  const maxRevenue = data
    ? Math.max(
        ...data.flatMap((s) => s.days.map((d) => d.revenue)),
        1
      )
    : 1;

  const yTicks = [0, maxRevenue / 2, maxRevenue];

  const labelDates: { x: number; label: string }[] = [];
  if (allDates.length > 1) {
    [0, Math.floor(allDates.length / 2), allDates.length - 1].forEach((idx) => {
      const parts = allDates[idx].split("-");
      const x = PAD.left + (idx / Math.max(allDates.length - 1, 1)) * CHART_W;
      labelDates.push({ x, label: `${parts[1]}/${parts[2]}` });
    });
  }

  return (
    <Card>
      <CardHeader title="Product Revenue Over Time" />
      <p className="text-[12px] text-[#8A8A8A] -mt-2 mb-4">
        Daily revenue per top product · last 30 days
      </p>

      {isLoading && <Skeleton className="h-[160px] w-full" />}

      {error && !isLoading && (
        <EmptyState title="Could not load revenue data" description="Revenue trend data is unavailable." />
      )}

      {!isLoading && !error && !data && (
        <EmptyState
          title="No revenue data"
          description="Sales data will populate this chart once data is ingested."
        />
      )}

      {!isLoading && !error && data && allDates.length > 0 && (
        <>
          <svg
            width="100%"
            viewBox={`0 0 ${W} ${H}`}
            preserveAspectRatio="none"
            role="img"
            aria-label="Product revenue trend chart"
          >
            {/* Y-axis gridlines + labels */}
            {yTicks.map((tick) => {
              const y = PAD.top + (1 - tick / maxRevenue) * CHART_H;
              const label =
                tick >= 1_000_000
                  ? `£${(tick / 1_000_000).toFixed(1)}M`
                  : tick >= 1_000
                  ? `£${(tick / 1_000).toFixed(0)}k`
                  : `£${tick.toFixed(0)}`;
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
                    {label}
                  </text>
                </g>
              );
            })}

            {/* Lines */}
            {data.map((series, i) => (
              <path
                key={series.id}
                d={buildLinePath(series, allDates, maxRevenue)}
                fill="none"
                stroke={SERIES_COLORS[i % SERIES_COLORS.length]}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}

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

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-3">
            {data.map((series, i) => (
              <span key={series.id} className="flex items-center gap-1.5 text-[11px] text-[#4A4A4A]">
                <span
                  className="inline-block w-6 h-0.5 rounded"
                  style={{ backgroundColor: SERIES_COLORS[i % SERIES_COLORS.length] }}
                />
                <span className="truncate max-w-[120px]" title={series.name}>
                  {series.name}
                </span>
              </span>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
