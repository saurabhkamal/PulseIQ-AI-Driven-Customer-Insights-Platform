"use client";

import { useState } from "react";
import type { TrendPrediction } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";

interface Props {
  trends: TrendPrediction[];
  isLoading: boolean;
}

const SIGNAL_COLOR = { high: "#2D9E6B", medium: "#F59E0B", low: "#9CA3AF" };
const SIGNAL_BG = { high: "rgba(45,158,107,0.08)", medium: "rgba(245,158,11,0.08)", low: "rgba(156,163,175,0.08)" };

export function TrendConfidenceChart({ trends, isLoading }: Props) {
  const [hovered, setHovered] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #D9D8D3", padding: "24px" }}>
        <Skeleton className="h-5 w-48 mb-6" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-6 flex-1" />
            <Skeleton className="h-3 w-10" />
          </div>
        ))}
      </div>
    );
  }

  if (trends.length === 0) return null;

  const top10 = [...trends]
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, 10);

  const maxConf = top10[0]?.confidence ?? 1;

  function truncate(s: string, n: number) {
    return s.length > n ? s.slice(0, n) + "…" : s;
  }

  return (
    <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #D9D8D3", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "24px" }}>
        <div>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1A1A1A", margin: "0 0 2px" }}>
            Top Trends by Confidence
          </h3>
          <p style={{ fontSize: "12px", color: "#8A8A8A", margin: 0 }}>
            Ranked by AI confidence score · hover for details
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          {(["high", "medium", "low"] as const).map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: SIGNAL_COLOR[s] }} />
              <span style={{ fontSize: "11px", color: "#6B7280", textTransform: "capitalize" }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Bars */}
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {top10.map((trend, i) => {
          const pct = (trend.confidence / maxConf) * 100;
          const confPct = Math.round(trend.confidence * 100);
          const color = SIGNAL_COLOR[trend.signalStrength];
          const bg = SIGNAL_BG[trend.signalStrength];
          const isHov = hovered === trend.id;

          return (
            <div
              key={trend.id}
              style={{
                display: "flex", alignItems: "center", gap: "12px",
                padding: "8px 10px", borderRadius: "8px",
                background: isHov ? bg : "transparent",
                border: `1px solid ${isHov ? color + "30" : "transparent"}`,
                cursor: "default", transition: "all 0.15s",
              }}
              onMouseEnter={() => setHovered(trend.id)}
              onMouseLeave={() => setHovered(null)}
            >
              {/* Rank */}
              <span style={{
                width: "20px", flexShrink: 0,
                fontSize: "12px", fontWeight: 700,
                color: i < 3 ? color : "#8A8A8A",
                textAlign: "center",
              }}>
                {i + 1}
              </span>

              {/* Name */}
              <span style={{
                width: "200px", flexShrink: 0,
                fontSize: "13px", fontWeight: 600,
                color: isHov ? "#1A1A1A" : "#4A4A4A",
                transition: "color 0.15s",
                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
              }}
                title={trend.trendName}
              >
                {truncate(trend.trendName, 32)}
              </span>

              {/* Bar track */}
              <div style={{ flex: 1, height: "8px", background: "#F3F2EF", borderRadius: "99px", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: "99px",
                  width: `${pct}%`,
                  background: `linear-gradient(90deg, ${color}cc, ${color})`,
                  boxShadow: isHov ? `0 0 8px ${color}60` : "none",
                  transition: "box-shadow 0.2s, width 0.6s ease",
                }} />
              </div>

              {/* Confidence % */}
              <span style={{
                width: "40px", flexShrink: 0, textAlign: "right",
                fontSize: "13px", fontWeight: 700,
                color: isHov ? color : "#6B7280",
                transition: "color 0.15s",
              }}>
                {confPct}%
              </span>

              {/* Signal dot */}
              <div style={{
                width: "8px", height: "8px", borderRadius: "50%",
                background: color, flexShrink: 0,
                boxShadow: isHov ? `0 0 6px ${color}` : "none",
                transition: "box-shadow 0.2s",
              }} />
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <p style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid #F3F2EF", fontSize: "11px", color: "#8A8A8A", margin: "16px 0 0" }}>
        Showing top {top10.length} of {trends.length} trends · Confidence represents AI certainty in the forecast
      </p>
    </div>
  );
}
