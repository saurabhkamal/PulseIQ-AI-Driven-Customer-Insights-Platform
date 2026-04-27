"use client";

import { useState } from "react";
import type { CohortData } from "@/services/analytics.service";
import { Skeleton } from "@/components/ui/Skeleton";

interface Props {
  cohortData: CohortData | null;
  isLoading: boolean;
}

const PAD = { top: 20, right: 24, bottom: 48, left: 52 };
const W = 480;
const H = 280;
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

export function RetentionCurveChart({ cohortData, isLoading }: Props) {
  const [hoveredWeek, setHoveredWeek] = useState<number | null>(null);

  if (isLoading) {
    return (
      <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #D9D8D3", padding: "24px" }}>
        <Skeleton className="h-5 w-48 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!cohortData || cohortData.rows.length === 0) return null;

  const numWeeks = Math.max(...cohortData.rows.map((r) => r.retention.length), 2);
  const weekIndices = Array.from({ length: numWeeks }, (_, i) => i);
  const yTicks = [0, 25, 50, 75, 100];

  function toX(wi: number): number {
    return PAD.left + (wi / Math.max(numWeeks - 1, 1)) * PLOT_W;
  }
  function toY(pct: number): number {
    return PAD.top + PLOT_H - (pct / 100) * PLOT_H;
  }

  // Average retention per week across all cohorts
  const avgRetention: (number | null)[] = weekIndices.map((wi) => {
    const vals = cohortData.rows
      .map((r) => r.retention[wi])
      .filter((v): v is number => v !== undefined && v !== null);
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
  });

  function buildLinePath(points: { x: number; y: number }[]): string {
    if (points.length === 0) return "";
    return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  }

  const avgPoints = weekIndices
    .map((wi) => {
      const val = avgRetention[wi];
      return val !== null ? { x: toX(wi), y: toY(val) } : null;
    })
    .filter((p): p is { x: number; y: number } => p !== null);

  const avgLinePath = buildLinePath(avgPoints);
  const areaPath =
    avgPoints.length > 0
      ? `${avgLinePath} L ${toX(numWeeks - 1)} ${toY(0)} L ${toX(0)} ${toY(0)} Z`
      : "";

  const slotW = numWeeks > 1 ? PLOT_W / (numWeeks - 1) : PLOT_W;

  return (
    <div style={{
      background: "#fff", borderRadius: "10px", border: "1px solid #D9D8D3",
      padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1A1A1A", margin: "0 0 2px" }}>
            Cohort Retention Curves
          </h3>
          <p style={{ fontSize: "12px", color: "#8A8A8A", margin: 0 }}>
            Week-over-week retention · {cohortData.rows.length} cohorts
          </p>
        </div>
        {/* Legend */}
        <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "20px", height: "2.5px", background: "#0A66C2", borderRadius: "2px" }} />
            <span style={{ fontSize: "11px", color: "#6B7280" }}>Average</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div style={{ width: "20px", height: "1.5px", background: "#D1D5DB", borderRadius: "2px" }} />
            <span style={{ fontSize: "11px", color: "#6B7280" }}>Individual</span>
          </div>
        </div>
      </div>

      <div style={{ position: "relative", userSelect: "none" }}>
        <svg
          width="100%"
          viewBox={`0 0 ${W} ${H}`}
          style={{ overflow: "visible", display: "block" }}
        >
          <defs>
            <linearGradient id="rc-area-grad" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#0A66C2" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0A66C2" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map((tick) => (
            <line key={tick}
              x1={PAD.left} y1={toY(tick)} x2={PAD.left + PLOT_W} y2={toY(tick)}
              stroke="#F0EFEB" strokeWidth="1" />
          ))}

          {/* Hover column highlight */}
          {hoveredWeek !== null && (
            <rect
              x={toX(hoveredWeek) - slotW / 2}
              y={PAD.top}
              width={slotW}
              height={PLOT_H}
              fill="#0A66C2"
              opacity={0.04}
            />
          )}

          {/* Area fill under average */}
          {areaPath && <path d={areaPath} fill="url(#rc-area-grad)" />}

          {/* Individual cohort lines */}
          {cohortData.rows.map((row, ri) => {
            const pts = weekIndices
              .map((wi) => {
                const val = row.retention[wi];
                return val !== undefined ? { x: toX(wi), y: toY(val) } : null;
              })
              .filter((p): p is { x: number; y: number } => p !== null);
            if (pts.length < 2) return null;
            return (
              <path key={ri}
                d={buildLinePath(pts)}
                fill="none" stroke="#D1D5DB" strokeWidth="1.5" opacity={0.7} />
            );
          })}

          {/* Average line */}
          {avgLinePath && (
            <path d={avgLinePath} fill="none" stroke="#0A66C2" strokeWidth="2.5"
              strokeLinecap="round" strokeLinejoin="round" />
          )}

          {/* Average dots */}
          {avgRetention.map((val, wi) =>
            val !== null ? (
              <circle key={wi}
                cx={toX(wi)} cy={toY(val)} r={hoveredWeek === wi ? 5 : 3.5}
                fill="#0A66C2" stroke="white" strokeWidth="2"
                style={{ transition: "r 0.15s" }} />
            ) : null
          )}

          {/* Axes */}
          <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + PLOT_H} stroke="#D9D8D3" strokeWidth="1" />
          <line x1={PAD.left} y1={PAD.top + PLOT_H} x2={PAD.left + PLOT_W} y2={PAD.top + PLOT_H} stroke="#D9D8D3" strokeWidth="1" />

          {/* Y-axis labels */}
          {yTicks.map((tick) => (
            <g key={tick}>
              <line x1={PAD.left - 4} y1={toY(tick)} x2={PAD.left} y2={toY(tick)} stroke="#D9D8D3" strokeWidth="1" />
              <text x={PAD.left - 8} y={toY(tick) + 4} textAnchor="end" style={{ fontSize: "10px", fill: "#8A8A8A" }}>
                {tick}%
              </text>
            </g>
          ))}

          {/* X-axis labels */}
          {weekIndices.map((wi) => (
            <g key={wi}>
              <line x1={toX(wi)} y1={PAD.top + PLOT_H} x2={toX(wi)} y2={PAD.top + PLOT_H + 4} stroke="#D9D8D3" strokeWidth="1" />
              <text x={toX(wi)} y={PAD.top + PLOT_H + 16} textAnchor="middle"
                style={{
                  fontSize: "10px",
                  fill: hoveredWeek === wi ? "#0A66C2" : "#8A8A8A",
                  fontWeight: hoveredWeek === wi ? 700 : 400,
                }}>
                W{wi}
              </text>
            </g>
          ))}

          {/* Axis titles */}
          <text x={PAD.left + PLOT_W / 2} y={H - 4} textAnchor="middle"
            style={{ fontSize: "11px", fill: "#6B7280", fontWeight: 600 }}>
            Week
          </text>
          <text transform={`translate(12,${PAD.top + PLOT_H / 2}) rotate(-90)`}
            textAnchor="middle" style={{ fontSize: "11px", fill: "#6B7280", fontWeight: 600 }}>
            Retention %
          </text>

          {/* Invisible hover hit areas */}
          {weekIndices.map((wi) => (
            <rect key={wi}
              x={toX(wi) - slotW / 2}
              y={PAD.top}
              width={slotW}
              height={PLOT_H}
              fill="transparent"
              style={{ cursor: "crosshair" }}
              onMouseEnter={() => setHoveredWeek(wi)}
              onMouseLeave={() => setHoveredWeek(null)}
            />
          ))}
        </svg>

        {/* Tooltip */}
        {hoveredWeek !== null && avgRetention[hoveredWeek] !== null && (
          <div style={{
            position: "absolute",
            left: `${Math.min((toX(hoveredWeek) / W) * 100 + 2, 58)}%`,
            top: "8px",
            background: "#1A1A1A",
            color: "#fff",
            borderRadius: "8px",
            padding: "10px 14px",
            fontSize: "12px",
            pointerEvents: "none",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            zIndex: 10,
            minWidth: "140px",
          }}>
            <p style={{ margin: "0 0 4px", fontWeight: 700, fontSize: "13px" }}>Week {hoveredWeek}</p>
            <p style={{ margin: "0 0 2px", color: "rgba(255,255,255,0.65)" }}>
              Avg retention: <strong style={{ color: "#fff" }}>{Math.round(avgRetention[hoveredWeek]!)}%</strong>
            </p>
            <p style={{ margin: 0, color: "rgba(255,255,255,0.5)", fontSize: "11px" }}>
              {cohortData.rows.filter((r) => r.retention[hoveredWeek] !== undefined).length} cohorts
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
