"use client";

import { useState } from "react";
import type { TrendPrediction } from "@/types";
import { Skeleton } from "@/components/ui/Skeleton";

interface Props {
  trends: TrendPrediction[];
  isLoading: boolean;
}

function parseDays(period: string): number {
  const m = period.match(/(\d+)/);
  return m ? parseInt(m[1]) : 30;
}

const SIGNAL_COLOR = { high: "#2D9E6B", medium: "#F59E0B", low: "#9CA3AF" };
const SIGNAL_R = { high: 9, medium: 7, low: 5 };

const PAD = { top: 20, right: 20, bottom: 48, left: 52 };
const W = 520; const H = 280;
const PLOT_W = W - PAD.left - PAD.right;
const PLOT_H = H - PAD.top - PAD.bottom;

export function TrendScatterPlot({ trends, isLoading }: Props) {
  const [tooltip, setTooltip] = useState<{ trend: TrendPrediction; x: number; y: number } | null>(null);

  if (isLoading) {
    return (
      <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #D9D8D3", padding: "24px" }}>
        <Skeleton className="h-5 w-48 mb-6" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (trends.length === 0) return null;

  const horizons = trends.map((t) => parseDays(t.forecastPeriod));
  const maxHorizon = Math.max(...horizons, 1);
  const minHorizon = Math.min(...horizons);

  // Axis ticks
  const xTicks = [0, 30, 60, 90, 120].filter((v) => v <= maxHorizon + 15);
  const yTicks = [0, 25, 50, 75, 100];

  function toX(days: number) {
    return PAD.left + ((days - 0) / (maxHorizon + 15)) * PLOT_W;
  }
  function toY(conf: number) {
    return PAD.top + PLOT_H - (conf / 100) * PLOT_H;
  }

  return (
    <div style={{ background: "#fff", borderRadius: "10px", border: "1px solid #D9D8D3", padding: "24px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
        <div>
          <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1A1A1A", margin: "0 0 2px" }}>
            Confidence vs. Forecast Horizon
          </h3>
          <p style={{ fontSize: "12px", color: "#8A8A8A", margin: 0 }}>
            Near-term + high confidence = act now · Far-term = monitor
          </p>
        </div>
        {/* Legend */}
        <div style={{ display: "flex", gap: "14px", flexShrink: 0 }}>
          {(["high", "medium", "low"] as const).map((s) => (
            <div key={s} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <div style={{ width: SIGNAL_R[s] * 2, height: SIGNAL_R[s] * 2, borderRadius: "50%", background: SIGNAL_COLOR[s] }} />
              <span style={{ fontSize: "11px", color: "#6B7280", textTransform: "capitalize" }}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ position: "relative", userSelect: "none" }}>
        <svg
          width="100%"
          viewBox={`0 0 ${W} ${H}`}
          style={{ overflow: "visible", display: "block" }}
        >
          {/* Grid lines */}
          {yTicks.map((tick) => (
            <line
              key={tick}
              x1={PAD.left} y1={toY(tick)}
              x2={PAD.left + PLOT_W} y2={toY(tick)}
              stroke="#F0EFEb" strokeWidth="1"
            />
          ))}
          {xTicks.map((tick) => (
            <line
              key={tick}
              x1={toX(tick)} y1={PAD.top}
              x2={toX(tick)} y2={PAD.top + PLOT_H}
              stroke="#F0EFEb" strokeWidth="1"
            />
          ))}

          {/* Quadrant shading: top-left = high conf + short horizon = act now */}
          <rect
            x={PAD.left} y={PAD.top}
            width={toX(45) - PAD.left} height={toY(65) - PAD.top}
            fill="rgba(45,158,107,0.04)"
          />
          <text x={PAD.left + 4} y={PAD.top + 14} style={{ fontSize: "9px", fill: "#2D9E6B", fontWeight: 600 }}>ACT NOW</text>

          {/* Axes */}
          <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + PLOT_H} stroke="#D9D8D3" strokeWidth="1" />
          <line x1={PAD.left} y1={PAD.top + PLOT_H} x2={PAD.left + PLOT_W} y2={PAD.top + PLOT_H} stroke="#D9D8D3" strokeWidth="1" />

          {/* Y ticks + labels */}
          {yTicks.map((tick) => (
            <g key={tick}>
              <line x1={PAD.left - 4} y1={toY(tick)} x2={PAD.left} y2={toY(tick)} stroke="#D9D8D3" strokeWidth="1" />
              <text x={PAD.left - 8} y={toY(tick) + 4} textAnchor="end" style={{ fontSize: "10px", fill: "#8A8A8A" }}>
                {tick}%
              </text>
            </g>
          ))}

          {/* X ticks + labels */}
          {xTicks.map((tick) => (
            <g key={tick}>
              <line x1={toX(tick)} y1={PAD.top + PLOT_H} x2={toX(tick)} y2={PAD.top + PLOT_H + 4} stroke="#D9D8D3" strokeWidth="1" />
              <text x={toX(tick)} y={PAD.top + PLOT_H + 16} textAnchor="middle" style={{ fontSize: "10px", fill: "#8A8A8A" }}>
                {tick}d
              </text>
            </g>
          ))}

          {/* Axis labels */}
          <text
            x={PAD.left + PLOT_W / 2} y={H - 4}
            textAnchor="middle" style={{ fontSize: "11px", fill: "#6B7280", fontWeight: 600 }}
          >
            Forecast Horizon (days)
          </text>
          <text
            transform={`translate(12,${PAD.top + PLOT_H / 2}) rotate(-90)`}
            textAnchor="middle" style={{ fontSize: "11px", fill: "#6B7280", fontWeight: 600 }}
          >
            Confidence
          </text>

          {/* Data points */}
          {trends.map((trend) => {
            const days = parseDays(trend.forecastPeriod);
            const cx = toX(days);
            const cy = toY(trend.confidence * 100);
            const color = SIGNAL_COLOR[trend.signalStrength];
            const rad = SIGNAL_R[trend.signalStrength];
            const isHov = tooltip?.trend.id === trend.id;

            return (
              <g key={trend.id} style={{ cursor: "pointer" }}>
                {isHov && (
                  <circle cx={cx} cy={cy} r={rad + 6} fill={color} opacity={0.2} />
                )}
                <circle
                  cx={cx} cy={cy} r={rad}
                  fill={color} fillOpacity={0.85}
                  stroke="white" strokeWidth="1.5"
                  style={{ transition: "r 0.15s ease" }}
                  onMouseEnter={(e) => {
                    const rect = (e.currentTarget.ownerSVGElement as SVGSVGElement).getBoundingClientRect();
                    const svgW = rect.width;
                    const svgH = rect.height;
                    const pctX = cx / W;
                    const pctY = cy / H;
                    setTooltip({ trend, x: pctX * svgW, y: pctY * svgH });
                  }}
                  onMouseLeave={() => setTooltip(null)}
                />
              </g>
            );
          })}
        </svg>

        {/* Tooltip */}
        {tooltip && (
          <div style={{
            position: "absolute",
            left: Math.min(tooltip.x + 12, 360),
            top: Math.max(tooltip.y - 60, 0),
            background: "#1A1A1A",
            color: "#fff",
            borderRadius: "8px",
            padding: "10px 14px",
            fontSize: "12px",
            maxWidth: "220px",
            pointerEvents: "none",
            boxShadow: "0 4px 16px rgba(0,0,0,0.3)",
            zIndex: 10,
          }}>
            <p style={{ margin: "0 0 4px", fontWeight: 700, lineHeight: 1.3, fontSize: "13px" }}>
              {tooltip.trend.trendName}
            </p>
            <p style={{ margin: "0 0 2px", color: "rgba(255,255,255,0.65)" }}>
              Confidence: <strong style={{ color: "#fff" }}>{Math.round(tooltip.trend.confidence * 100)}%</strong>
            </p>
            <p style={{ margin: "0 0 2px", color: "rgba(255,255,255,0.65)" }}>
              Horizon: <strong style={{ color: "#fff" }}>{tooltip.trend.forecastPeriod}</strong>
            </p>
            <p style={{ margin: 0, color: SIGNAL_COLOR[tooltip.trend.signalStrength], fontWeight: 600, textTransform: "capitalize" }}>
              {tooltip.trend.signalStrength} signal
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
