"use client";

import { useTrendsInsights } from "@/hooks/useTrendsInsights";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

const SIGNAL_CONFIG = {
  high:   { label: "High",   color: "#CC3333", bg: "#CC33331A" },
  medium: { label: "Medium", color: "#E8940A", bg: "#E8940A1A" },
  low:    { label: "Low",    color: "#6B7280", bg: "#6B72801A" },
} as const;

const ORDER: Array<"high" | "medium" | "low"> = ["high", "medium", "low"];

const R = 52;        // donut outer radius
const r = 32;        // donut inner radius
const CX = 72;       // centre x
const CY = 72;       // centre y
const SVG_W = 300;
const SVG_H = 144;

function describeArc(cx: number, cy: number, outerR: number, innerR: number, startAngle: number, endAngle: number): string {
  const toRad = (deg: number) => (deg - 90) * (Math.PI / 180);
  const x1o = cx + outerR * Math.cos(toRad(startAngle));
  const y1o = cy + outerR * Math.sin(toRad(startAngle));
  const x2o = cx + outerR * Math.cos(toRad(endAngle));
  const y2o = cy + outerR * Math.sin(toRad(endAngle));
  const x1i = cx + innerR * Math.cos(toRad(endAngle));
  const y1i = cy + innerR * Math.sin(toRad(endAngle));
  const x2i = cx + innerR * Math.cos(toRad(startAngle));
  const y2i = cy + innerR * Math.sin(toRad(startAngle));
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return [
    `M${x1o},${y1o}`,
    `A${outerR},${outerR} 0 ${large} 1 ${x2o},${y2o}`,
    `L${x1i},${y1i}`,
    `A${innerR},${innerR} 0 ${large} 0 ${x2i},${y2i}`,
    "Z",
  ].join(" ");
}

export function TrendSignalBreakdown() {
  const { data, isLoading, error } = useTrendsInsights();

  const breakdown = data?.signal_breakdown ?? [];
  const total = breakdown.reduce((s, b) => s + b.count, 0);

  const counts: Record<string, number> = {};
  breakdown.forEach((b) => { counts[b.signal_strength] = b.count; });

  // Build donut segments
  let angle = 0;
  const segments = ORDER.map((strength) => {
    const count = counts[strength] ?? 0;
    const pct = total > 0 ? count / total : 0;
    const sweep = pct * 360;
    const path = sweep > 0 && sweep < 360
      ? describeArc(CX, CY, R, r, angle, angle + sweep)
      : sweep >= 360
      ? [
          describeArc(CX, CY, R, r, 0, 179.99),
          " ",
          describeArc(CX, CY, R, r, 180, 359.99),
        ].join("")
      : "";
    const seg = { strength, count, pct, path, startAngle: angle };
    angle += sweep;
    return seg;
  }).filter((s) => s.count > 0);

  return (
    <Card>
      <CardHeader title="Signal Strength" />
      <p className="text-[12px] text-[#8A8A8A] -mt-2 mb-4">
        Distribution across all active trends
      </p>

      {isLoading && <Skeleton className="h-[144px] w-full" />}

      {error && !isLoading && (
        <EmptyState title="Could not load data" description="Signal data unavailable." />
      )}

      {!isLoading && !error && total === 0 && (
        <EmptyState title="No trend data" description="Trends will appear after the AI agent runs." />
      )}

      {!isLoading && !error && total > 0 && (
        <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} role="img" aria-label="Signal strength donut chart">
          {/* Donut segments */}
          {segments.map((seg) => (
            <path
              key={seg.strength}
              d={seg.path}
              fill={SIGNAL_CONFIG[seg.strength as keyof typeof SIGNAL_CONFIG].color}
            >
              <title>{SIGNAL_CONFIG[seg.strength as keyof typeof SIGNAL_CONFIG].label}: {seg.count}</title>
            </path>
          ))}

          {/* Centre total */}
          <text x={CX} y={CY - 6} textAnchor="middle" dominantBaseline="middle"
            fontSize={20} fontWeight="700" fill="#1A1A1A" fontFamily="system-ui, sans-serif">
            {total}
          </text>
          <text x={CX} y={CY + 12} textAnchor="middle" dominantBaseline="middle"
            fontSize={10} fill="#8A8A8A" fontFamily="system-ui, sans-serif">
            trends
          </text>

          {/* Legend */}
          {ORDER.map((strength, li) => {
            const cfg = SIGNAL_CONFIG[strength];
            const count = counts[strength] ?? 0;
            const pct = total > 0 ? Math.round((count / total) * 100) : 0;
            const legendX = 148;
            const legendY = 28 + li * 36;
            return (
              <g key={strength}>
                <rect x={legendX} y={legendY} width={10} height={10} rx={2} fill={cfg.color} />
                <text x={legendX + 14} y={legendY + 5} dominantBaseline="middle"
                  fontSize={12} fill="#4A4A4A" fontFamily="system-ui, sans-serif" fontWeight="500">
                  {cfg.label}
                </text>
                <text x={SVG_W - 8} y={legendY + 5} textAnchor="end" dominantBaseline="middle"
                  fontSize={12} fill="#1A1A1A" fontFamily="system-ui, sans-serif" fontWeight="700">
                  {count}
                  <tspan fontSize={10} fill="#8A8A8A" fontWeight="400"> ({pct}%)</tspan>
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </Card>
  );
}
