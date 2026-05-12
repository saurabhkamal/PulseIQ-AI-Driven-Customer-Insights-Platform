"use client";

import { useState } from "react";
import { useTrendsInsights } from "@/hooks/useTrendsInsights";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ScatterPoint } from "@/services/trends.service";

const SVG_W = 520;
const SVG_H = 260;
const PAD = { top: 24, right: 24, bottom: 44, left: 56 };
const CHART_W = SVG_W - PAD.left - PAD.right;
const CHART_H = SVG_H - PAD.top - PAD.bottom;

const SIGNAL_COLORS = {
  high:   "#CC3333",
  medium: "#E8940A",
  low:    "#6B7280",
} as const;

// Quadrant config: horizon midpoint = 60 days, confidence midpoint = 0.5
const H_MID = 60;
const C_MID = 0.5;

const QUADRANT_LABELS = [
  { label: "Act Now",  x: PAD.left + 8,            y: PAD.top + 14,           color: "#2D9E6B" },
  { label: "Monitor",  x: PAD.left + CHART_W - 8,  y: PAD.top + 14,           color: "#E8940A", anchor: "end" as const },
  { label: "Low Priority", x: PAD.left + 8,        y: PAD.top + CHART_H - 6,  color: "#8A8A8A" },
  { label: "Emerging", x: PAD.left + CHART_W - 8,  y: PAD.top + CHART_H - 6,  color: "#7C3AED", anchor: "end" as const },
];

export function TrendHorizonScatter() {
  const { data, isLoading, error } = useTrendsInsights();
  const [tooltip, setTooltip] = useState<{ point: ScatterPoint; x: number; y: number } | null>(null);

  const points = data?.scatter_points ?? [];

  const maxHorizon = points.length > 0 ? Math.max(...points.map((p) => p.horizon_days), 120) : 120;

  const toX = (h: number) => PAD.left + (h / maxHorizon) * CHART_W;
  const toY = (c: number) => PAD.top + (1 - c) * CHART_H;

  const midX = toX(H_MID);
  const midY = toY(C_MID);

  const xTicks = [0, Math.round(maxHorizon / 3), Math.round((maxHorizon * 2) / 3), maxHorizon];
  const yTicks = [0, 0.25, 0.5, 0.75, 1.0];

  return (
    <Card>
      <CardHeader title="Trend Horizon vs Confidence" />
      <p className="text-[12px] text-[#8A8A8A] -mt-2 mb-3">
        X = days until trend materialises &nbsp;·&nbsp; Y = AI confidence score &nbsp;·&nbsp; dot size = signal strength
      </p>

      {isLoading && <Skeleton className="h-[260px] w-full" />}

      {error && !isLoading && (
        <EmptyState title="Could not load scatter data" description="Horizon data unavailable." />
      )}

      {!isLoading && !error && points.length === 0 && (
        <EmptyState title="No horizon data" description="Trends need horizon_days set to appear here." />
      )}

      {!isLoading && !error && points.length > 0 && (
        <div className="relative">
          <svg
            width="100%"
            viewBox={`0 0 ${SVG_W} ${SVG_H}`}
            role="img"
            aria-label="Trend horizon scatter plot"
            className="overflow-visible"
          >
            {/* Quadrant background fills */}
            <rect x={PAD.left} y={PAD.top} width={midX - PAD.left} height={midY - PAD.top}
              fill="#2D9E6B" fillOpacity={0.04} />
            <rect x={midX} y={PAD.top} width={PAD.left + CHART_W - midX} height={midY - PAD.top}
              fill="#E8940A" fillOpacity={0.04} />
            <rect x={PAD.left} y={midY} width={midX - PAD.left} height={PAD.top + CHART_H - midY}
              fill="#8A8A8A" fillOpacity={0.04} />
            <rect x={midX} y={midY} width={PAD.left + CHART_W - midX} height={PAD.top + CHART_H - midY}
              fill="#7C3AED" fillOpacity={0.04} />

            {/* Y-axis gridlines + labels */}
            {yTicks.map((tick) => {
              const y = toY(tick);
              return (
                <g key={tick}>
                  <line x1={PAD.left} y1={y} x2={PAD.left + CHART_W} y2={y}
                    stroke="#EAE9E4" strokeWidth={1} />
                  <text x={PAD.left - 6} y={y} textAnchor="end" dominantBaseline="middle"
                    fontSize={10} fill="#8A8A8A" fontFamily="system-ui, sans-serif">
                    {Math.round(tick * 100)}%
                  </text>
                </g>
              );
            })}

            {/* X-axis labels */}
            {xTicks.map((tick) => {
              const x = toX(tick);
              return (
                <text key={tick} x={x} y={SVG_H - 6} textAnchor="middle"
                  fontSize={10} fill="#8A8A8A" fontFamily="system-ui, sans-serif">
                  {tick}d
                </text>
              );
            })}

            {/* Axis labels */}
            <text x={PAD.left + CHART_W / 2} y={SVG_H - 2} textAnchor="middle"
              fontSize={10} fill="#8A8A8A" fontFamily="system-ui, sans-serif">
              Horizon (days)
            </text>

            {/* Quadrant dividers */}
            <line x1={midX} y1={PAD.top} x2={midX} y2={PAD.top + CHART_H}
              stroke="#D9D8D3" strokeWidth={1} strokeDasharray="4 3" />
            <line x1={PAD.left} y1={midY} x2={PAD.left + CHART_W} y2={midY}
              stroke="#D9D8D3" strokeWidth={1} strokeDasharray="4 3" />

            {/* Quadrant labels */}
            {QUADRANT_LABELS.map((ql) => (
              <text key={ql.label} x={ql.x} y={ql.y}
                textAnchor={ql.anchor ?? "start"} fontSize={9} fill={ql.color}
                fontFamily="system-ui, sans-serif" fontWeight="600" fillOpacity={0.7}>
                {ql.label}
              </text>
            ))}

            {/* Data points */}
            {points.map((p) => {
              const cx = toX(p.horizon_days);
              const cy = toY(p.confidence);
              const dotR = p.signal_strength === "high" ? 7 : p.signal_strength === "medium" ? 5 : 4;
              const color = SIGNAL_COLORS[p.signal_strength];
              return (
                <circle
                  key={p.id}
                  cx={cx}
                  cy={cy}
                  r={dotR}
                  fill={color}
                  fillOpacity={0.8}
                  stroke="white"
                  strokeWidth={1.5}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setTooltip({ point: p, x: cx, y: cy })}
                  onMouseLeave={() => setTooltip(null)}
                >
                  <title>{p.title} — {p.horizon_days}d · {Math.round(p.confidence * 100)}% confidence</title>
                </circle>
              );
            })}

            {/* Tooltip */}
            {tooltip && (() => {
              const tx = tooltip.x + 10;
              const ty = tooltip.y - 36;
              const label = tooltip.point.title.length > 28
                ? tooltip.point.title.slice(0, 26) + "…"
                : tooltip.point.title;
              return (
                <g>
                  <rect x={tx - 4} y={ty - 4} width={180} height={44} rx={4}
                    fill="#1A1A1A" fillOpacity={0.88} />
                  <text x={tx} y={ty + 8} fontSize={11} fill="white"
                    fontFamily="system-ui, sans-serif" fontWeight="600">
                    {label}
                  </text>
                  <text x={tx} y={ty + 24} fontSize={10} fill="#D9D8D3"
                    fontFamily="system-ui, sans-serif">
                    {tooltip.point.horizon_days}d · {Math.round(tooltip.point.confidence * 100)}% · {tooltip.point.category}
                  </text>
                </g>
              );
            })()}
          </svg>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-2 text-[11px] text-[#8A8A8A]">
            {(["high", "medium", "low"] as const).map((s) => (
              <span key={s} className="flex items-center gap-1.5">
                <span className="inline-block rounded-full w-2.5 h-2.5"
                  style={{ backgroundColor: SIGNAL_COLORS[s] }} />
                {s.charAt(0).toUpperCase() + s.slice(1)} signal
              </span>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}
