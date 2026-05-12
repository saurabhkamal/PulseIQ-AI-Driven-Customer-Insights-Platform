"use client";

import { useFunnel } from "@/hooks/useFunnel";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPercent } from "@/lib/utils";

const SVG_W = 460;
const MAX_W = 340;
const STAGE_H = 50;
const CENTER = SVG_W / 2;
const PAD_TOP = 10;
const PAD_SIDE = (SVG_W - MAX_W) / 2;

// Gradient stops: dark navy → brand blue across all stages
const STAGE_COLORS = [
  { top: "#1E3A8A", bot: "#1E40AF" },
  { top: "#1D4ED8", bot: "#2563EB" },
  { top: "#2563EB", bot: "#3B82F6" },
  { top: "#3B82F6", bot: "#60A5FA" },
  { top: "#60A5FA", bot: "#93C5FD" },
];

export function FunnelChart() {
  const { data, isLoading, error } = useFunnel();

  const svgH = data ? PAD_TOP + data.steps.length * STAGE_H + 32 : 200;

  return (
    <Card>
      <CardHeader title="Conversion Funnel" />

      {isLoading && (
        <div className="space-y-1 flex flex-col items-center">
          <Skeleton className="h-[50px] rounded w-full" />
          <Skeleton className="h-[50px] rounded w-11/12" />
          <Skeleton className="h-[50px] rounded w-9/12" />
          <Skeleton className="h-[50px] rounded w-7/12" />
        </div>
      )}

      {error && !isLoading && (
        <EmptyState title="Could not load funnel" description="Funnel data is unavailable." />
      )}

      {!isLoading && !error && !data && (
        <EmptyState
          title="No funnel data"
          description="Connect a data source to see your conversion funnel."
        />
      )}

      {!isLoading && !error && data && (
        <>
          <svg
            width="100%"
            viewBox={`0 0 ${SVG_W} ${svgH}`}
            role="img"
            aria-label="Conversion funnel chart"
          >
            <defs>
              {data.steps.map((_, i) => {
                const c = STAGE_COLORS[Math.min(i, STAGE_COLORS.length - 1)];
                return (
                  <linearGradient key={i} id={`fg${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={c.top} />
                    <stop offset="100%" stopColor={c.bot} />
                  </linearGradient>
                );
              })}
            </defs>

            {data.steps.map((step, i) => {
              const maxCount = data.steps[0].count;
              const topW =
                i === 0 ? MAX_W : (data.steps[i - 1].count / maxCount) * MAX_W;
              const botW = (step.count / maxCount) * MAX_W;
              const y = PAD_TOP + i * STAGE_H;

              // Trapezoid: top edge wider → bottom edge narrower
              const tl = CENTER - topW / 2;
              const tr = CENTER + topW / 2;
              const bl = CENTER - botW / 2;
              const br = CENTER + botW / 2;
              const path = `M${tl},${y} L${tr},${y} L${br},${y + STAGE_H} L${bl},${y + STAGE_H} Z`;

              const midY = y + STAGE_H / 2;
              // Only label conversion % when trapezoid is wide enough to show it on the side
              const labelX = CENTER + topW / 2 + 6;
              const showSideLabel = labelX + 40 < SVG_W;

              return (
                <g key={step.step}>
                  {/* Trapezoid body */}
                  <path d={path} fill={`url(#fg${i})`} />

                  {/* White divider line between stages */}
                  {i > 0 && (
                    <line
                      x1={CENTER - topW / 2}
                      y1={y}
                      x2={CENTER + topW / 2}
                      y2={y}
                      stroke="white"
                      strokeWidth={1.5}
                      strokeOpacity={0.4}
                    />
                  )}

                  {/* Stage name */}
                  <text
                    x={CENTER}
                    y={midY - 7}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={11}
                    fill="white"
                    fillOpacity={0.9}
                    fontFamily="system-ui, sans-serif"
                    fontWeight="500"
                  >
                    {step.step}
                  </text>

                  {/* Count */}
                  <text
                    x={CENTER}
                    y={midY + 9}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={14}
                    fill="white"
                    fontFamily="system-ui, sans-serif"
                    fontWeight="700"
                  >
                    {step.count.toLocaleString()}
                  </text>

                  {/* Step-conversion % on right side */}
                  {i > 0 && showSideLabel && (
                    <text
                      x={labelX}
                      y={midY}
                      textAnchor="start"
                      dominantBaseline="middle"
                      fontSize={11}
                      fill="#CC3333"
                      fontFamily="system-ui, sans-serif"
                      fontWeight="600"
                    >
                      ↓ {formatPercent(step.conversionRate)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          <p className="text-[12px] text-[#8A8A8A] pt-3 mt-1 border-t border-[#D9D8D3]">
            Overall conversion:{" "}
            <span className="font-semibold text-[#2D9E6B]">
              {formatPercent(data.overallConversion)}
            </span>
          </p>
        </>
      )}
    </Card>
  );
}
