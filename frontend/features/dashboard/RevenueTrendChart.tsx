"use client";

import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { RevenueDayPoint } from "@/services/dashboard.service";

const W = 640;
const H = 160;
const PAD_TOP = 16;
const PAD_RIGHT = 16;
const PAD_BOTTOM = 36;
const PAD_LEFT = 64;
const CW = W - PAD_LEFT - PAD_RIGHT;
const CH = H - PAD_TOP - PAD_BOTTOM;

function buildPath(points: RevenueDayPoint[], maxVal: number): string {
  if (points.length === 0) return "";
  return points
    .map((p, i) => {
      const x = PAD_LEFT + (i / Math.max(points.length - 1, 1)) * CW;
      const y = PAD_TOP + (1 - p.revenue / maxVal) * CH;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function buildArea(points: RevenueDayPoint[], maxVal: number): string {
  if (points.length === 0) return "";
  const line = buildPath(points, maxVal);
  const lastX = (PAD_LEFT + CW).toFixed(1);
  const firstX = PAD_LEFT.toFixed(1);
  const baseY = (PAD_TOP + CH).toFixed(1);
  return `${line} L${lastX},${baseY} L${firstX},${baseY} Z`;
}

function fmtGbp(v: number): string {
  if (v >= 1_000_000) return `£${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `£${(v / 1_000).toFixed(0)}K`;
  return `£${v.toFixed(0)}`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function RevenueTrendChart() {
  const { data, isLoading, error } = useDashboardSummary();

  if (isLoading) {
    return (
      <div className="bg-white border border-[#D9D8D3] rounded-xl p-5 shadow-sm">
        <Skeleton className="h-5 w-48 mb-4" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white border border-[#D9D8D3] rounded-xl p-5 shadow-sm">
        <EmptyState title="Revenue data unavailable" description="Could not load transaction trend." />
      </div>
    );
  }

  const points = data.revenue_trend;

  if (points.length === 0) {
    return (
      <div className="bg-white border border-[#D9D8D3] rounded-xl p-5 shadow-sm">
        <EmptyState title="No revenue data" description="Transaction data will appear once sales are ingested." />
      </div>
    );
  }

  const maxVal = Math.max(...points.map((p) => p.revenue), 1);
  const total30d = points.reduce((s, p) => s + p.revenue, 0);

  const yTicks = 4;
  const yStep = maxVal / yTicks;

  // Show ~6 evenly spaced x-axis labels
  const xLabelIndices = [0, Math.floor(points.length / 4), Math.floor(points.length / 2),
    Math.floor((3 * points.length) / 4), points.length - 1];
  const uniqueIndices = [...new Set(xLabelIndices)].filter((i) => i < points.length);

  return (
    <div className="bg-white border border-[#D9D8D3] rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-[15px] font-semibold text-[#1A1A1A]">Transaction Volume — 30 Days</h3>
          <p className="text-[12px] text-[#8A8A8A] mt-0.5">Daily revenue across all products</p>
        </div>
        <div className="text-right">
          <p className="text-[22px] font-bold text-[#0A66C2] leading-none">{fmtGbp(total30d)}</p>
          <p className="text-[11px] text-[#8A8A8A] mt-0.5">30-day total</p>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        aria-label="Revenue trend chart over last 30 days"
      >
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0A66C2" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#0A66C2" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const y = PAD_TOP + (i / yTicks) * CH;
          return (
            <g key={i}>
              <line
                x1={PAD_LEFT} y1={y} x2={PAD_LEFT + CW} y2={y}
                stroke="#EAE9E4" strokeWidth={1}
              />
              <text
                x={PAD_LEFT - 6} y={y + 4}
                textAnchor="end"
                fontSize={10}
                fill="#8A8A8A"
              >
                {fmtGbp(maxVal - i * yStep)}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path
          d={buildArea(points, maxVal)}
          fill="url(#revGrad)"
        />

        {/* Line */}
        <path
          d={buildPath(points, maxVal)}
          fill="none"
          stroke="#0A66C2"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* X-axis labels */}
        {uniqueIndices.map((i) => {
          const x = PAD_LEFT + (i / Math.max(points.length - 1, 1)) * CW;
          return (
            <text
              key={i}
              x={x}
              y={H - 6}
              textAnchor="middle"
              fontSize={10}
              fill="#8A8A8A"
            >
              {fmtDate(points[i].date)}
            </text>
          );
        })}

        {/* Last data point dot */}
        {(() => {
          const last = points[points.length - 1];
          const lx = PAD_LEFT + CW;
          const ly = PAD_TOP + (1 - last.revenue / maxVal) * CH;
          return (
            <>
              <circle cx={lx} cy={ly} r={4} fill="#0A66C2" />
              <circle cx={lx} cy={ly} r={7} fill="#0A66C2" fillOpacity={0.15} />
            </>
          );
        })()}
      </svg>
    </div>
  );
}
