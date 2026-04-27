"use client";

import { useState } from "react";
import type { TrendPrediction } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";

interface Props {
  trends: TrendPrediction[];
  isLoading: boolean;
}

const SEGMENTS = [
  { key: "high" as const,   label: "High Signal",   color: "#2D9E6B", bg: "rgba(45,158,107,0.1)"  },
  { key: "medium" as const, label: "Medium Signal",  color: "#F59E0B", bg: "rgba(245,158,11,0.1)"  },
  { key: "low" as const,    label: "Low Signal",     color: "#6B7280", bg: "rgba(107,114,128,0.1)" },
];

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  if (endDeg - startDeg >= 360) endDeg = startDeg + 359.99;
  const s = polarToXY(cx, cy, r, startDeg);
  const e = polarToXY(cx, cy, r, endDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

export function TrendSignalDonut({ trends, isLoading }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #D9D8D3", padding: "24px" }}>
        <Skeleton className="h-5 w-36 mb-6" />
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Skeleton className="h-48 w-48 rounded-full" />
        </div>
      </div>
    );
  }

  const total = trends.length;
  const counts = {
    high: trends.filter((t) => t.signalStrength === "high").length,
    medium: trends.filter((t) => t.signalStrength === "medium").length,
    low: trends.filter((t) => t.signalStrength === "low").length,
  };

  const cx = 100; const cy = 100; const R = 80; const r = 52;
  let cursor = 0;

  const slices = SEGMENTS.map((seg) => {
    const pct = total > 0 ? counts[seg.key] / total : 0;
    const deg = pct * 360;
    const start = cursor;
    cursor += deg;
    return { ...seg, count: counts[seg.key], pct, start, end: cursor };
  });

  const active = hovered ? slices.find((s) => s.key === hovered) : null;

  return (
    <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #D9D8D3", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1A1A1A", margin: "0 0 2px" }}>Signal Distribution</h3>
        <p style={{ fontSize: "12px", color: "#8A8A8A", margin: 0 }}>Breakdown of AI trend signal strength</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
        {/* SVG Donut */}
        <div style={{ flexShrink: 0, position: "relative" }}>
          <svg width="200" height="200" viewBox="0 0 200 200">
            {/* Background track */}
            <circle cx={cx} cy={cy} r={(R + r) / 2} fill="none" stroke="#F3F2EF" strokeWidth={R - r} />

            {/* Segments */}
            {slices.map((sl) => {
              if (sl.count === 0) return null;
              const isHov = hovered === sl.key;
              const outerR = isHov ? R + 6 : R;
              const innerR = isHov ? r - 2 : r;
              const midAngle = sl.start + (sl.end - sl.start) / 2;
              const offset = isHov ? 5 : 0;
              const ox = offset > 0 ? Math.cos(((midAngle - 90) * Math.PI) / 180) * offset : 0;
              const oy = offset > 0 ? Math.sin(((midAngle - 90) * Math.PI) / 180) * offset : 0;

              return (
                <g
                  key={sl.key}
                  transform={`translate(${ox},${oy})`}
                  style={{ cursor: "pointer", transition: "transform 0.2s ease" }}
                  onMouseEnter={() => setHovered(sl.key)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <path
                    d={arcPath(cx, cy, (outerR + innerR) / 2, sl.start + 1.5, sl.end - 1.5)}
                    fill="none"
                    stroke={sl.color}
                    strokeWidth={outerR - innerR}
                    strokeLinecap="round"
                    opacity={hovered && !isHov ? 0.35 : 1}
                    style={{ transition: "all 0.2s ease" }}
                  />
                </g>
              );
            })}

            {/* Center text */}
            <text x={cx} y={cy - 10} textAnchor="middle" style={{ fontSize: "26px", fontWeight: 800, fill: active ? active.color : "#1A1A1A" }}>
              {active ? active.count : total}
            </text>
            <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontSize: "11px", fill: "#8A8A8A" }}>
              {active ? active.label : "total trends"}
            </text>
            {active && (
              <text x={cx} y={cy + 28} textAnchor="middle" style={{ fontSize: "13px", fontWeight: 700, fill: active.color }}>
                {Math.round(active.pct * 100)}%
              </text>
            )}
          </svg>
        </div>

        {/* Legend */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "12px" }}>
          {slices.map((sl) => (
            <div
              key={sl.key}
              style={{
                padding: "10px 12px", borderRadius: "8px",
                background: hovered === sl.key ? sl.bg : "transparent",
                border: `1px solid ${hovered === sl.key ? sl.color + "40" : "transparent"}`,
                cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={() => setHovered(sl.key)}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "5px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: sl.color, flexShrink: 0 }} />
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#1A1A1A" }}>{sl.label}</span>
                </div>
                <span style={{ fontSize: "14px", fontWeight: 800, color: sl.color }}>{sl.count}</span>
              </div>
              {/* Mini bar */}
              <div style={{ height: "4px", background: "#EAE9E4", borderRadius: "99px", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: "99px", background: sl.color,
                  width: `${Math.round(sl.pct * 100)}%`,
                  transition: "width 0.6s ease",
                }} />
              </div>
              <div style={{ fontSize: "11px", color: "#8A8A8A", marginTop: "3px" }}>
                {Math.round(sl.pct * 100)}% of total
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
