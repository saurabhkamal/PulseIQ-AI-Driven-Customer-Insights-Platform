"use client";

import Link from "next/link";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { Skeleton } from "@/components/ui/Skeleton";
import type { FunnelStageItem } from "@/services/dashboard.service";

function fmtStage(name: string): string {
  return name
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function MiniFunnel({ stages }: { stages: FunnelStageItem[] }) {
  if (stages.length === 0) return null;
  const maxCount = stages[0].count;
  const TOTAL_W = 200;
  const BAR_H = 24;
  const GAP = 4;
  const MIN_W = 40;

  return (
    <svg
      viewBox={`0 0 ${TOTAL_W} ${stages.length * (BAR_H + GAP)}`}
      className="w-full max-w-[200px] mx-auto"
      aria-label="Funnel visualization"
    >
      {stages.map((stage, i) => {
        const ratio = maxCount > 0 ? stage.count / maxCount : 0;
        const barW = Math.max(MIN_W, ratio * TOTAL_W);
        const x = (TOTAL_W - barW) / 2;
        const y = i * (BAR_H + GAP);
        const opacity = 1 - i * (0.18 / Math.max(stages.length - 1, 1));
        return (
          <g key={stage.stage}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={BAR_H}
              rx={4}
              fill="#0A66C2"
              fillOpacity={opacity}
            />
            <text
              x={TOTAL_W / 2}
              y={y + BAR_H / 2 + 4}
              textAnchor="middle"
              fontSize={9}
              fill="white"
              fontWeight="600"
            >
              {fmtStage(stage.stage)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function FunnelHealthCard() {
  const { data, isLoading, error } = useDashboardSummary();

  if (isLoading) {
    return (
      <div className="bg-white border border-[#D9D8D3] rounded-xl p-5 shadow-sm">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-16 w-20 mx-auto mb-3" />
        <Skeleton className="h-3 w-full" />
      </div>
    );
  }

  const funnel = data?.funnel_health ?? { conversion_rate: 0, stages: [], total_top: 0 };
  const hasData = funnel.stages.length > 0 && funnel.total_top > 0;

  return (
    <div className="bg-white border border-[#D9D8D3] rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="text-[15px] font-semibold text-[#1A1A1A]">Funnel Health</h3>
          <p className="text-[12px] text-[#8A8A8A] mt-0.5">End-to-end conversion — 30d</p>
        </div>
        <Link
          href="/analytics/behavior"
          className="text-[12px] text-[#0A66C2] hover:text-[#004182] font-medium transition-colors flex-shrink-0"
        >
          Details →
        </Link>
      </div>

      {!hasData ? (
        <div className="text-center py-4">
          <p className="text-[12px] text-[#8A8A8A]">No funnel events recorded yet</p>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-1 mb-4 justify-center">
            <span
              className={`text-[42px] font-bold leading-none ${
                funnel.conversion_rate >= 50
                  ? "text-[#2D9E6B]"
                  : funnel.conversion_rate >= 25
                  ? "text-[#E8940A]"
                  : "text-[#CC3333]"
              }`}
            >
              {funnel.conversion_rate.toFixed(1)}%
            </span>
          </div>

          <MiniFunnel stages={funnel.stages} />

          <div className="flex justify-between items-center mt-3 pt-2 border-t border-[#EAE9E4]">
            {funnel.stages.map((stage) => (
              <div key={stage.stage} className="text-center flex-1">
                <div className="text-[11px] font-semibold text-[#1A1A1A]">
                  {stage.count.toLocaleString()}
                </div>
                <div className="text-[9px] text-[#8A8A8A] truncate">{fmtStage(stage.stage)}</div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
