"use client";

import { useSentimentCharts } from "@/hooks/useSentimentCharts";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

const W = 480;
const H = 160;
const PAD = { top: 14, right: 16, bottom: 28, left: 44 };
const CHART_W = W - PAD.left - PAD.right;
const CHART_H = H - PAD.top - PAD.bottom;

export function SentimentVolumeChart() {
  const { data, isLoading, error } = useSentimentCharts();
  const weeks = data?.weekly_trend ?? [];

  const maxTotal = weeks.length > 0 ? Math.max(...weeks.map((w) => w.total), 1) : 1;
  const grandTotal = weeks.reduce((s, w) => s + w.total, 0);

  const n = weeks.length;
  const slotW = n > 0 ? CHART_W / n : CHART_W;
  const barW = Math.max(slotW - 2, 2);

  const yTicks = [0, Math.round(maxTotal / 2), maxTotal];

  const labelWeeks = n > 1
    ? [0, Math.floor(n / 2), n - 1].map((idx) => {
        const parts = weeks[idx].week.split("-");
        return { x: PAD.left + idx * slotW + slotW / 2, label: `${parts[1]}/${parts[2]}` };
      })
    : [];

  return (
    <Card>
      <CardHeader
        title="Feedback Volume Over Time"
        action={
          weeks.length > 0 ? (
            <span className="text-[12px] text-[#8A8A8A]">
              <span className="font-semibold text-[#1A1A1A]">{grandTotal.toLocaleString()}</span> total (12 wks)
            </span>
          ) : undefined
        }
      />
      <p className="text-[12px] text-[#8A8A8A] -mt-2 mb-3">
        Weekly feedback volume stacked by sentiment label
      </p>

      {isLoading && <Skeleton className="h-[160px] w-full" />}

      {error && !isLoading && (
        <EmptyState title="Could not load data" description="Volume data unavailable." />
      )}

      {!isLoading && !error && weeks.length === 0 && (
        <EmptyState title="No volume data" description="Feedback volume will appear once data is ingested." />
      )}

      {!isLoading && !error && weeks.length > 0 && (
        <>
          <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none"
            role="img" aria-label="Feedback volume stacked bar chart">
            {/* Y-axis gridlines */}
            {yTicks.map((tick) => {
              const y = PAD.top + (1 - tick / maxTotal) * CHART_H;
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

            {/* Stacked bars per week */}
            {weeks.map((w, i) => {
              const x = PAD.left + i * slotW + (slotW - barW) / 2;
              const baseY = PAD.top + CHART_H;
              const totalH = (w.total / maxTotal) * CHART_H;
              const posH = w.total > 0 ? (w.positive / w.total) * totalH : 0;
              const neuH = w.total > 0 ? (w.neutral / w.total) * totalH : 0;
              const negH = totalH - posH - neuH;

              return (
                <g key={w.week}>
                  {/* Negative — top */}
                  {negH > 0 && (
                    <rect x={x} y={baseY - totalH} width={barW} height={negH}
                      fill="#CC3333" opacity={0.85} rx={1}>
                      <title>{w.week} negative: {w.negative}</title>
                    </rect>
                  )}
                  {/* Neutral — middle */}
                  {neuH > 0 && (
                    <rect x={x} y={baseY - totalH + negH} width={barW} height={neuH}
                      fill="#6B7280" opacity={0.85}>
                      <title>{w.week} neutral: {w.neutral}</title>
                    </rect>
                  )}
                  {/* Positive — bottom */}
                  {posH > 0 && (
                    <rect x={x} y={baseY - posH} width={barW} height={posH}
                      fill="#2D9E6B" opacity={0.85} rx={1}>
                      <title>{w.week} positive: {w.positive}</title>
                    </rect>
                  )}
                </g>
              );
            })}

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
            {[
              { color: "#2D9E6B", label: "Positive" },
              { color: "#6B7280", label: "Neutral" },
              { color: "#CC3333", label: "Negative" },
            ].map(({ color, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-[11px] text-[#4A4A4A]">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: color }} />
                {label}
              </span>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
