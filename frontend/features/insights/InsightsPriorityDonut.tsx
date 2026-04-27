"use client";

import { useState } from "react";
import type { Insight, InsightPriority } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";

interface Props {
  insights: Insight[];
  isLoading: boolean;
}

const SEGMENTS = [
  { key: "high" as InsightPriority,   label: "High Impact",    color: "#CC3333", bg: "rgba(204,51,51,0.1)"  },
  { key: "medium" as InsightPriority, label: "Medium Impact",  color: "#E8940A", bg: "rgba(232,148,10,0.1)" },
  { key: "low" as InsightPriority,    label: "Low Impact",     color: "#6B7280", bg: "rgba(107,114,128,0.1)" },
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

export function InsightsPriorityDonut({ insights, isLoading }: Props) {
  const [hovered, setHovered] = useState<InsightPriority | null>(null);

  if (isLoading) {
    return (
      <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #D9D8D3", padding: "24px" }}>
        <Skeleton className="h-5 w-36 mb-6" />
        <div style={{ display: "flex", justifyContent: "center" }}>
          <Skeleton className="h-44 w-44 rounded-full" />
        </div>
      </div>
    );
  }

  const total = insights.length;
  const counts = {
    high: insights.filter((i) => i.priority === "high").length,
    medium: insights.filter((i) => i.priority === "medium").length,
    low: insights.filter((i) => i.priority === "low").length,
  };

  const cx = 96; const cy = 96; const R = 76; const r = 50;
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
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1A1A1A", margin: "0 0 2px" }}>Priority Breakdown</h3>
        <p style={{ fontSize: "12px", color: "#8A8A8A", margin: 0 }}>Distribution of AI insight impact levels</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
        {/* Donut */}
        <div style={{ flexShrink: 0 }}>
          <svg width="192" height="192" viewBox="0 0 192 192">
            <circle cx={cx} cy={cy} r={(R + r) / 2} fill="none" stroke="#F3F2EF" strokeWidth={R - r} />
            {slices.map((sl) => {
              if (sl.count === 0) return null;
              const isHov = hovered === sl.key;
              const outerR = isHov ? R + 5 : R;
              const innerR = isHov ? r - 2 : r;
              const midAngle = sl.start + (sl.end - sl.start) / 2;
              const ox = isHov ? Math.cos(((midAngle - 90) * Math.PI) / 180) * 5 : 0;
              const oy = isHov ? Math.sin(((midAngle - 90) * Math.PI) / 180) * 5 : 0;
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
                    opacity={hovered && !isHov ? 0.3 : 1}
                    style={{ transition: "all 0.2s ease" }}
                  />
                </g>
              );
            })}
            <text x={cx} y={cy - 8} textAnchor="middle" style={{ fontSize: "24px", fontWeight: 800, fill: active ? active.color : "#1A1A1A" }}>
              {active ? active.count : total}
            </text>
            <text x={cx} y={cy + 11} textAnchor="middle" style={{ fontSize: "11px", fill: "#8A8A8A" }}>
              {active ? active.label : "total insights"}
            </text>
            {active && (
              <text x={cx} y={cy + 28} textAnchor="middle" style={{ fontSize: "13px", fontWeight: 700, fill: active.color }}>
                {Math.round(active.pct * 100)}%
              </text>
            )}
          </svg>
        </div>

        {/* Legend */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
          {slices.map((sl) => (
            <div
              key={sl.key}
              style={{
                padding: "8px 12px", borderRadius: "8px",
                background: hovered === sl.key ? sl.bg : "transparent",
                border: `1px solid ${hovered === sl.key ? sl.color + "40" : "transparent"}`,
                cursor: "pointer", transition: "all 0.2s",
              }}
              onMouseEnter={() => setHovered(sl.key)}
              onMouseLeave={() => setHovered(null)}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "4px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: sl.color, flexShrink: 0 }} />
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#1A1A1A" }}>{sl.label}</span>
                </div>
                <span style={{ fontSize: "14px", fontWeight: 800, color: sl.color }}>{sl.count}</span>
              </div>
              <div style={{ height: "4px", background: "#EAE9E4", borderRadius: "99px", overflow: "hidden" }}>
                <div style={{ height: "100%", borderRadius: "99px", background: sl.color, width: `${Math.round(sl.pct * 100)}%`, transition: "width 0.6s ease" }} />
              </div>
              <div style={{ fontSize: "11px", color: "#8A8A8A", marginTop: "3px" }}>{Math.round(sl.pct * 100)}% of total</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
