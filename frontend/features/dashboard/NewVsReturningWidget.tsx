"use client";

import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { Skeleton } from "@/components/ui/Skeleton";

const CX = 52;
const CY = 52;
const R = 38;
const INNER_R = 24;
const TAU = 2 * Math.PI;

function buildSlice(cx: number, cy: number, r: number, innerR: number, startAngle: number, endAngle: number): string {
  if (Math.abs(endAngle - startAngle) < 0.001) return "";
  const gap = 0.025;
  const s = startAngle + gap;
  const e = endAngle - gap;
  const outerStart = { x: cx + r * Math.cos(s - Math.PI / 2), y: cy + r * Math.sin(s - Math.PI / 2) };
  const outerEnd   = { x: cx + r * Math.cos(e - Math.PI / 2), y: cy + r * Math.sin(e - Math.PI / 2) };
  const innerStart = { x: cx + innerR * Math.cos(s - Math.PI / 2), y: cy + innerR * Math.sin(s - Math.PI / 2) };
  const innerEnd   = { x: cx + innerR * Math.cos(e - Math.PI / 2), y: cy + innerR * Math.sin(e - Math.PI / 2) };
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return [
    `M${outerStart.x.toFixed(2)},${outerStart.y.toFixed(2)}`,
    `A${r},${r} 0 ${largeArc},1 ${outerEnd.x.toFixed(2)},${outerEnd.y.toFixed(2)}`,
    `L${innerEnd.x.toFixed(2)},${innerEnd.y.toFixed(2)}`,
    `A${innerR},${innerR} 0 ${largeArc},0 ${innerStart.x.toFixed(2)},${innerStart.y.toFixed(2)}`,
    "Z",
  ].join(" ");
}

export function NewVsReturningWidget() {
  const { data, isLoading, error } = useDashboardSummary();

  if (isLoading) {
    return (
      <div className="bg-white border border-[#D9D8D3] rounded-xl p-5 shadow-sm">
        <Skeleton className="h-4 w-40 mb-4" />
        <div className="flex items-center gap-4">
          <Skeleton className="w-[104px] h-[104px] rounded-full flex-shrink-0" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const nvr = data?.new_vs_returning ?? {
    new_customers: 0,
    returning_customers: 0,
    total: 0,
    new_pct: 0,
    returning_pct: 0,
  };

  const newAngle = (nvr.new_pct / 100) * TAU;
  const retAngle = TAU - newAngle;

  const newPath = buildSlice(CX, CY, R, INNER_R, 0, newAngle);
  const retPath = buildSlice(CX, CY, R, INNER_R, newAngle, TAU);

  const noData = nvr.total === 0;

  return (
    <div className="bg-white border border-[#D9D8D3] rounded-xl p-5 shadow-sm">
      <div className="mb-3">
        <h3 className="text-[15px] font-semibold text-[#1A1A1A]">New vs Returning</h3>
        <p className="text-[12px] text-[#8A8A8A] mt-0.5">Customer sessions — 30d</p>
      </div>

      {noData ? (
        <p className="text-[12px] text-[#8A8A8A] py-4 text-center">No customer event data yet</p>
      ) : (
        <div className="flex items-center gap-5">
          {/* Donut */}
          <svg viewBox={`0 0 ${CX * 2} ${CY * 2}`} className="w-[104px] h-[104px] flex-shrink-0" aria-label="New vs returning customers donut chart">
            {newPath && <path d={newPath} fill="#0A66C2" />}
            {retPath && <path d={retPath} fill="#2D9E6B" />}
            <text x={CX} y={CY - 5} textAnchor="middle" fontSize={14} fontWeight="700" fill="#1A1A1A">
              {nvr.new_pct.toFixed(0)}%
            </text>
            <text x={CX} y={CY + 10} textAnchor="middle" fontSize={9} fill="#8A8A8A">
              new
            </text>
          </svg>

          {/* Legend */}
          <div className="space-y-3 flex-1">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#0A66C2] flex-shrink-0" />
                <span className="text-[12px] text-[#4A4A4A]">New</span>
              </div>
              <div className="flex items-baseline gap-1 pl-4">
                <span className="text-[18px] font-bold text-[#0A66C2] leading-none">
                  {nvr.new_pct.toFixed(1)}%
                </span>
                <span className="text-[11px] text-[#8A8A8A]">{nvr.new_customers.toLocaleString()} sessions</span>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2D9E6B] flex-shrink-0" />
                <span className="text-[12px] text-[#4A4A4A]">Returning</span>
              </div>
              <div className="flex items-baseline gap-1 pl-4">
                <span className="text-[18px] font-bold text-[#2D9E6B] leading-none">
                  {nvr.returning_pct.toFixed(1)}%
                </span>
                <span className="text-[11px] text-[#8A8A8A]">{nvr.returning_customers.toLocaleString()} sessions</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
