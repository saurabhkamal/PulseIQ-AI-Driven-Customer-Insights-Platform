import { TREND_COLORS, TREND_ICONS } from "@/lib/utils";
import type { KpiMetric } from "@/types";

interface KpiCardProps {
  metric: KpiMetric;
}

const TREND_BORDER: Record<string, string> = {
  up: "border-l-[#2D9E6B]",
  down: "border-l-[#CC3333]",
  flat: "border-l-[#D9D8D3]",
};

export function KpiCard({ metric }: KpiCardProps) {
  return (
    <div
      className={`bg-white rounded-lg border border-[#D9D8D3] border-l-4 ${TREND_BORDER[metric.trend]} shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6`}
    >
      <p className="text-[12px] font-medium text-[#6B7280] uppercase tracking-wide mb-2">
        {metric.label}
      </p>
      <p className="text-[32px] font-bold text-[#1A1A1A] leading-none mb-2">
        {metric.formattedValue}
      </p>
      <div className="flex items-center gap-1">
        <span
          className={`text-[13px] font-medium ${TREND_COLORS[metric.trend]}`}
          aria-label={`Trend: ${metric.trend}`}
        >
          {TREND_ICONS[metric.trend]} {metric.trendValue}
        </span>
        <span className="text-[12px] text-[#8A8A8A]">vs last period</span>
      </div>
    </div>
  );
}
