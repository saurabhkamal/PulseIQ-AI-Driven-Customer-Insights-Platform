import type { Metadata } from "next";
import { TrendsList } from "@/features/analytics/TrendsList";
import { TrendSignalBreakdown } from "@/features/analytics/TrendSignalBreakdown";
import { TrendsByCategory } from "@/features/analytics/TrendsByCategory";
import { TrendHorizonScatter } from "@/features/analytics/TrendHorizonScatter";
import { CategoryConfidenceRanking } from "@/features/analytics/CategoryConfidenceRanking";
import { TrendVolumeChart } from "@/features/analytics/TrendVolumeChart";
import { EmergingVsMaturingChart } from "@/features/analytics/EmergingVsMaturingChart";

export const metadata: Metadata = {
  title: "Market Trend Intelligence — PulseIQ",
};

export default function TrendsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[24px] font-semibold text-[#1A1A1A]">Market Trend Intelligence</h1>
          <p className="text-[14px] text-[#8A8A8A] mt-1">
            AI-forecasted emerging financial product and market signals for your organisation.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded-full px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" aria-hidden="true" />
          <span className="text-[12px] font-medium text-[#7C3AED]">GPT-4o powered</span>
        </div>
      </div>

      {/* Summary row: Signal Breakdown + Trends by Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrendSignalBreakdown />
        <TrendsByCategory />
      </div>

      {/* Scatter plot — full width, most unique visualisation */}
      <TrendHorizonScatter />

      {/* Confidence ranking + Volume over time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CategoryConfidenceRanking />
        <TrendVolumeChart />
      </div>

      {/* Emerging vs Maturing — full width */}
      <EmergingVsMaturingChart />

      {/* Trends list */}
      <TrendsList />
    </div>
  );
}
