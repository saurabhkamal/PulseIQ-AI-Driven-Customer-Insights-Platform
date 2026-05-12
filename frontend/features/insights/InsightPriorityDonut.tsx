"use client";

import { useInsightsSummary } from "@/hooks/useInsightsSummary";
import { Card, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";

const PRIORITY_CONFIG = [
  { key: "high" as const, label: "High", color: "#CC3333" },
  { key: "medium" as const, label: "Medium", color: "#E8940A" },
  { key: "low" as const, label: "Low", color: "#6B7280" },
];

const CX = 80;
const CY = 80;
const R = 62;
const INNER_R = 40;
const GAP = 0.02; // radians between arcs

function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number): string {
  const s = { x: cx + r * Math.cos(startAngle), y: cy + r * Math.sin(startAngle) };
  const e = { x: cx + r * Math.cos(endAngle), y: cy + r * Math.sin(endAngle) };
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M${s.x.toFixed(2)},${s.y.toFixed(2)} A${r},${r} 0 ${largeArc},1 ${e.x.toFixed(2)},${e.y.toFixed(2)}`;
}

function buildDonutPath(cx: number, cy: number, r: number, innerR: number, startAngle: number, endAngle: number): string {
  const outerArc = describeArc(cx, cy, r, startAngle, endAngle);
  const innerStart = { x: cx + innerR * Math.cos(endAngle), y: cy + innerR * Math.sin(endAngle) };
  const innerEnd = { x: cx + innerR * Math.cos(startAngle), y: cy + innerR * Math.sin(startAngle) };
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `${outerArc} L${innerStart.x.toFixed(2)},${innerStart.y.toFixed(2)} A${innerR},${innerR} 0 ${largeArc},0 ${innerEnd.x.toFixed(2)},${innerEnd.y.toFixed(2)} Z`;
}

export function InsightPriorityDonut() {
  const { data, isLoading, error } = useInsightsSummary();

  const total = data?.total ?? 0;
  const breakdown = data?.priority_breakdown ?? [];

  const counts: Record<string, number> = {};
  for (const b of breakdown) counts[b.priority] = b.count;

  const slices: Array<{ config: typeof PRIORITY_CONFIG[number]; count: number; startAngle: number; endAngle: number }> = [];
  if (total > 0) {
    let angle = -Math.PI / 2;
    for (const cfg of PRIORITY_CONFIG) {
      const count = counts[cfg.key] ?? 0;
      if (count === 0) continue;
      const sweep = (count / total) * (2 * Math.PI) - GAP;
      slices.push({ config: cfg, count, startAngle: angle + GAP / 2, endAngle: angle + GAP / 2 + sweep });
      angle += (count / total) * (2 * Math.PI);
    }
  }

  return (
    <Card>
      <CardHeader title="Priority Distribution" />
      <p className="text-[12px] text-[#8A8A8A] -mt-2 mb-4">
        Breakdown of AI insights by urgency level
      </p>

      {isLoading && <Skeleton className="h-[160px] w-full" />}

      {error && !isLoading && (
        <EmptyState title="Could not load data" description="Priority data unavailable." />
      )}

      {!isLoading && !error && total === 0 && (
        <EmptyState title="No insights yet" description="Insights will appear after the AI agent processes your data." />
      )}

      {!isLoading && !error && total > 0 && (
        <div className="flex items-center gap-6">
          <svg width="160" height="160" viewBox="0 0 160 160" role="img" aria-label="Priority distribution donut">
            {slices.map(({ config, startAngle, endAngle }) => (
              <path
                key={config.key}
                d={buildDonutPath(CX, CY, R, INNER_R, startAngle, endAngle)}
                fill={config.color}
                opacity={0.9}
              >
                <title>{config.label}: {counts[config.key] ?? 0}</title>
              </path>
            ))}
            <text x={CX} y={CY - 6} textAnchor="middle" fontSize={22} fontWeight="700" fill="#1A1A1A" fontFamily="system-ui, sans-serif">
              {total}
            </text>
            <text x={CX} y={CY + 12} textAnchor="middle" fontSize={10} fill="#8A8A8A" fontFamily="system-ui, sans-serif">
              total
            </text>
          </svg>

          <div className="flex flex-col gap-3 flex-1">
            {PRIORITY_CONFIG.map((cfg) => {
              const count = counts[cfg.key] ?? 0;
              const pct = total > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={cfg.key} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-sm shrink-0" style={{ backgroundColor: cfg.color }} />
                  <span className="text-[13px] text-[#4A4A4A] flex-1">{cfg.label}</span>
                  <span className="text-[13px] font-semibold text-[#1A1A1A]">{count}</span>
                  <span className="text-[11px] text-[#8A8A8A] w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
}
