import type { Metadata } from "next";
import { KpiGrid } from "@/features/dashboard/KpiGrid";
import { InsightsSummaryCard } from "@/features/dashboard/InsightsSummaryCard";
import { SentimentSummaryCard } from "@/features/dashboard/SentimentSummaryCard";
import { TopTrendsCard } from "@/features/dashboard/TopTrendsCard";

export const metadata: Metadata = {
  title: "Dashboard — PulseIQ",
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-[24px] font-semibold text-[#1A1A1A]">Dashboard</h1>
        <p className="text-[14px] text-[#8A8A8A] mt-1">
          Your organization&apos;s key metrics and AI-generated insights.
        </p>
      </div>

      {/* KPI metrics row */}
      <KpiGrid />

      {/* Lower grid: insights + sentiment + trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <InsightsSummaryCard />
        </div>
        <div className="space-y-6">
          <SentimentSummaryCard />
          <TopTrendsCard />
        </div>
      </div>
    </div>
  );
}
