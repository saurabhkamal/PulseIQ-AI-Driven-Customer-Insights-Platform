"use client";

import { useState } from "react";
import type { FunnelData } from "@/services/analytics.service";
import { Skeleton } from "@/components/ui/Skeleton";

interface Props {
  funnelData: FunnelData | null;
  isLoading: boolean;
}

const W = 420;
const STAGE_H = 54;
const GAP = 10;
const CX = W / 2;
const MAX_WIDTH = 360;
const MIN_WIDTH = 90;

const STAGE_COLORS: [string, string][] = [
  ["#0A66C2", "#1878D4"],
  ["#1878D4", "#2485DC"],
  ["#2485DC", "#2D9DCF"],
  ["#2794C0", "#2D9E6B"],
  ["#2D9E6B", "#34A876"],
];

export function BehaviorFunnelSVG({ funnelData, isLoading }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #D9D8D3", padding: "24px" }}>
        <Skeleton className="h-5 w-44 mb-6" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (!funnelData || funnelData.steps.length === 0) return null;

  const steps = funnelData.steps;
  const maxCount = steps[0].count || 1;
  const svgH = steps.length * (STAGE_H + GAP) + 32;

  function stageW(count: number) {
    return MIN_WIDTH + (count / maxCount) * (MAX_WIDTH - MIN_WIDTH);
  }

  return (
    <div style={{
      background: "#fff", borderRadius: "10px", border: "1px solid #D9D8D3",
      padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1A1A1A", margin: "0 0 2px" }}>
          Conversion Funnel
        </h3>
        <p style={{ fontSize: "12px", color: "#8A8A8A", margin: 0 }}>
          User journey · {Math.round(funnelData.overallConversion)}% overall conversion
        </p>
      </div>

      <svg
        width="100%"
        viewBox={`0 0 ${W} ${svgH}`}
        style={{ overflow: "visible", display: "block" }}
      >
        <defs>
          {steps.map((_, i) => {
            const [c1, c2] = STAGE_COLORS[i % STAGE_COLORS.length];
            return (
              <linearGradient key={i} id={`fg-${i}`} x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor={c1} />
                <stop offset="100%" stopColor={c2} />
              </linearGradient>
            );
          })}
        </defs>

        {steps.map((step, i) => {
          const topW = stageW(step.count);
          const nextCount = steps[i + 1]?.count ?? step.count * 0.75;
          const botW = i < steps.length - 1 ? stageW(nextCount) : Math.max(stageW(step.count) - 40, MIN_WIDTH);
          const y1 = i * (STAGE_H + GAP);
          const y2 = y1 + STAGE_H;
          const isHov = hovered === i;
          const drop = i > 0 ? Math.round(100 - step.conversionRate) : 0;

          const path = [
            `M ${CX - topW / 2} ${y1}`,
            `L ${CX + topW / 2} ${y1}`,
            `L ${CX + botW / 2} ${y2}`,
            `L ${CX - botW / 2} ${y2}`,
            "Z",
          ].join(" ");

          return (
            <g
              key={step.step}
              style={{ cursor: "default" }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Shadow / glow on hover */}
              {isHov && (
                <path d={path} fill={STAGE_COLORS[i % STAGE_COLORS.length][0]}
                  opacity={0.15} transform="translate(0,3)" style={{ filter: "blur(4px)" }} />
              )}

              {/* Trapezoid */}
              <path
                d={path}
                fill={`url(#fg-${i})`}
                opacity={isHov ? 1 : 0.88}
                style={{ transition: "opacity 0.15s" }}
              />

              {/* White shimmer overlay on hover */}
              {isHov && <path d={path} fill="white" opacity={0.08} />}

              {/* Step label centered */}
              <text
                x={CX} y={y1 + STAGE_H / 2 + 1}
                textAnchor="middle"
                style={{ fontSize: "12px", fontWeight: 700, fill: "white", pointerEvents: "none", userSelect: "none" }}
              >
                {step.step}
              </text>
              {/* Count below name */}
              <text
                x={CX} y={y1 + STAGE_H / 2 + 16}
                textAnchor="middle"
                style={{ fontSize: "11px", fill: "rgba(255,255,255,0.8)", pointerEvents: "none", userSelect: "none" }}
              >
                {step.count.toLocaleString()} users
              </text>

              {/* Drop-off label on left (between stages) */}
              {i > 0 && (
                <text
                  x={CX - topW / 2 - 8} y={y1 + STAGE_H / 2 + 5}
                  textAnchor="end"
                  style={{ fontSize: "11px", fill: "#CC3333", fontWeight: 700, userSelect: "none" }}
                >
                  -{drop}%
                </text>
              )}

              {/* Rank number on right */}
              <text
                x={CX + topW / 2 + 8} y={y1 + STAGE_H / 2 + 5}
                style={{ fontSize: "11px", fill: "#6B7280", userSelect: "none" }}
              >
                #{i + 1}
              </text>
            </g>
          );
        })}

        {/* Footer conversion note */}
        <text
          x={CX} y={svgH - 4}
          textAnchor="middle"
          style={{ fontSize: "11px", fill: "#8A8A8A" }}
        >
          {steps[steps.length - 1]?.count.toLocaleString() ?? "0"} completed · {Math.round(funnelData.overallConversion)}% conversion
        </text>
      </svg>
    </div>
  );
}
