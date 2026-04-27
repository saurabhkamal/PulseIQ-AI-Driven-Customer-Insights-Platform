"use client";

import { useState } from "react";
import type { FunnelData } from "@/services/analytics.service";
import { Skeleton } from "@/components/ui/Skeleton";

interface Props {
  funnelData: FunnelData | null;
  isLoading: boolean;
}

const W = 480;
const CX = W / 2;
const TRAP_H = 56;
const GAP_H = 38;
const MAX_TRAP_W = 330;
const MIN_TRAP_W = 76;
const ICON_X = 20;
const ICON_R = 13;

const STAGE_COLORS: [string, string][] = [
  ["#0A66C2", "#1878D4"],
  ["#1878D4", "#2079CC"],
  ["#2079CC", "#2888C4"],
  ["#2888C4", "#2D9E6B"],
  ["#2D9E6B", "#34A876"],
];

function stageW(count: number, maxCount: number): number {
  return MIN_TRAP_W + (count / Math.max(maxCount, 1)) * (MAX_TRAP_W - MIN_TRAP_W);
}

function stageY(i: number): number {
  return i * (TRAP_H + GAP_H);
}

export function BehaviorFunnelSVG({ funnelData, isLoading }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #D9D8D3", padding: "24px" }}>
        <Skeleton className="h-5 w-44 mb-4" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (!funnelData || funnelData.steps.length === 0) return null;

  const steps = funnelData.steps;
  const maxCount = steps[0].count || 1;
  const svgH = steps.length * TRAP_H + (steps.length - 1) * GAP_H + 36;

  return (
    <div style={{
      background: "#fff", borderRadius: "10px", border: "1px solid #D9D8D3",
      padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1A1A1A", margin: "0 0 2px" }}>
            Conversion Funnel
          </h3>
          <p style={{ fontSize: "12px", color: "#8A8A8A", margin: 0 }}>
            {steps.length} stages · {steps[0]?.count.toLocaleString() ?? 0} users entered
          </p>
        </div>
        {/* Prominent conversion badge */}
        <div style={{
          textAlign: "center", background: "rgba(45,158,107,0.08)",
          borderRadius: "10px", padding: "10px 18px",
          border: "1px solid rgba(45,158,107,0.25)",
        }}>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "#2D9E6B", lineHeight: 1 }}>
            {Math.round(funnelData.overallConversion)}%
          </div>
          <div style={{ fontSize: "10px", color: "#6B7280", marginTop: "3px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Converted
          </div>
        </div>
      </div>

      <svg width="100%" viewBox={`0 0 ${W} ${svgH}`} style={{ overflow: "visible", display: "block" }}>
        <defs>
          {steps.map((_, i) => {
            const [c1, c2] = STAGE_COLORS[i % STAGE_COLORS.length];
            return (
              <linearGradient key={i} id={`bfs-${i}`} x1="0" x2="1" y1="0" y2="0">
                <stop offset="0%" stopColor={c1} />
                <stop offset="100%" stopColor={c2} />
              </linearGradient>
            );
          })}
          {/* Shimmer gradient for hover */}
          <linearGradient id="bfs-shine" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.12" />
            <stop offset="50%" stopColor="white" stopOpacity="0.05" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
        </defs>

        {steps.map((step, i) => {
          const topW = stageW(step.count, maxCount);
          const nextCount = steps[i + 1]?.count ?? Math.max(step.count * 0.75, 0);
          const botW = i < steps.length - 1
            ? stageW(nextCount, maxCount)
            : Math.max(topW - 36, MIN_TRAP_W);
          const y1 = stageY(i);
          const y2 = y1 + TRAP_H;
          const isHov = hovered === i;
          const color = STAGE_COLORS[i % STAGE_COLORS.length][0];
          const isCartStage = step.abandonmentRate !== undefined;

          const dropped = i > 0 ? (steps[i - 1].count - step.count) : 0;
          const dropPct = i > 0 ? Math.round(100 - step.conversionRate) : 0;

          const path = [
            `M ${CX - topW / 2} ${y1}`,
            `L ${CX + topW / 2} ${y1}`,
            `L ${CX + botW / 2} ${y2}`,
            `L ${CX - botW / 2} ${y2}`,
            "Z",
          ].join(" ");

          // Gap row geometry (above this stage, if i > 0)
          const gapTop = y1 - GAP_H;
          const gapMid = y1 - GAP_H / 2;
          const pillW = 128;
          const pillH = 20;

          return (
            <g key={step.step}>
              {/* ── Gap row: connector + drop pill ── */}
              {i > 0 && (
                <g>
                  {/* Upper dashed line segment */}
                  <line
                    x1={CX} y1={gapTop + 2}
                    x2={CX} y2={gapMid - pillH / 2 - 2}
                    stroke="#D1D5DB" strokeWidth="1.5" strokeDasharray="3,3"
                  />
                  {/* Drop pill */}
                  <rect
                    x={CX - pillW / 2} y={gapMid - pillH / 2}
                    width={pillW} height={pillH} rx={pillH / 2}
                    fill="#FEF2F2" stroke="#FECACA" strokeWidth="1"
                  />
                  <text
                    x={CX} y={gapMid + 5}
                    textAnchor="middle"
                    style={{ fontSize: "10px", fontWeight: 700, fill: "#CC3333", userSelect: "none" }}
                  >
                    ↓ {dropPct}% · {dropped.toLocaleString()} dropped
                  </text>
                  {/* Lower dashed line segment */}
                  <line
                    x1={CX} y1={gapMid + pillH / 2 + 2}
                    x2={CX} y2={y1 - 2}
                    stroke="#D1D5DB" strokeWidth="1.5" strokeDasharray="3,3"
                  />
                </g>
              )}

              {/* ── Trapezoid ── */}
              <g
                style={{ cursor: "default" }}
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered(null)}
              >
                {/* Glow drop-shadow on hover */}
                {isHov && (
                  <path
                    d={path} fill={color} opacity={0.18}
                    transform="translate(0,5)"
                    style={{ filter: "blur(8px)" }}
                  />
                )}

                {/* Main fill */}
                <path
                  d={path}
                  fill={`url(#bfs-${i})`}
                  opacity={isHov ? 1 : 0.87}
                  style={{ transition: "opacity 0.15s" }}
                />

                {/* Shine overlay on hover */}
                {isHov && (
                  <path d={path} fill="url(#bfs-shine)" />
                )}

                {/* Stage name */}
                <text
                  x={CX} y={y1 + TRAP_H / 2 + 1}
                  textAnchor="middle"
                  style={{ fontSize: "12px", fontWeight: 700, fill: "white", pointerEvents: "none", userSelect: "none" }}
                >
                  {step.step}
                </text>
                {/* User count */}
                <text
                  x={CX} y={y1 + TRAP_H / 2 + 16}
                  textAnchor="middle"
                  style={{ fontSize: "11px", fill: "rgba(255,255,255,0.82)", pointerEvents: "none", userSelect: "none" }}
                >
                  {step.count.toLocaleString()} users
                </text>

                {/* Cart abandonment badge (amber pill, right side) */}
                {isCartStage && (
                  <g>
                    <rect
                      x={CX + topW / 2 + 8} y={y1 + TRAP_H / 2 - 11}
                      width={80} height={22} rx={11}
                      fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1"
                    />
                    <text
                      x={CX + topW / 2 + 48} y={y1 + TRAP_H / 2 + 5}
                      textAnchor="middle"
                      style={{ fontSize: "10px", fontWeight: 700, fill: "#92400E", userSelect: "none" }}
                    >
                      {Math.round(step.abandonmentRate!)}% left cart
                    </text>
                  </g>
                )}
              </g>

              {/* ── Stage number circle (left side) ── */}
              <circle
                cx={ICON_X} cy={y1 + TRAP_H / 2}
                r={ICON_R}
                fill={`url(#bfs-${i})`}
                opacity={isHov ? 1 : 0.85}
              />
              <text
                x={ICON_X} y={y1 + TRAP_H / 2 + 5}
                textAnchor="middle"
                style={{ fontSize: "11px", fontWeight: 800, fill: "white", userSelect: "none" }}
              >
                {i + 1}
              </text>
            </g>
          );
        })}

        {/* Footer */}
        <text
          x={CX} y={svgH - 4}
          textAnchor="middle"
          style={{ fontSize: "11px", fill: "#9CA3AF" }}
        >
          {steps[steps.length - 1]?.count.toLocaleString() ?? "0"} completed
          {" · "}
          {steps.length} stages tracked
        </text>
      </svg>
    </div>
  );
}
