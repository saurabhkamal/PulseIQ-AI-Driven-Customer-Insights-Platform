import type { Metadata } from "next";
import { FunnelChart } from "@/features/analytics/FunnelChart";
import { CohortTable } from "@/features/analytics/CohortTable";
import { ActivityHeatmap } from "@/features/analytics/ActivityHeatmap";
import { TopProductsChart } from "@/features/analytics/TopProductsChart";
import { DropoffWaterfall } from "@/features/analytics/DropoffWaterfall";
import { DauTrendChart } from "@/features/analytics/DauTrendChart";
import { NewVsReturningChart } from "@/features/analytics/NewVsReturningChart";
import { SegmentEngagementCards } from "@/features/analytics/SegmentEngagementCards";
import { ProductRevenueTrend } from "@/features/analytics/ProductRevenueTrend";

export const metadata: Metadata = {
  title: "Customer Journey Analytics — PulseIQ",
};

export default function BehaviorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold text-[#1A1A1A]">Customer Journey Analytics</h1>
        <p className="text-[14px] text-[#8A8A8A] mt-1">
          Application &amp; onboarding funnels, customer retention cohorts, and engagement heatmaps.
        </p>
      </div>

      {/* Funnel + Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FunnelChart />
        <ActivityHeatmap />
      </div>

      {/* Drop-off waterfall + Top products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DropoffWaterfall />
        <TopProductsChart />
      </div>

      {/* DAU trend + New vs Returning */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DauTrendChart />
        <NewVsReturningChart />
      </div>

      {/* Segment engagement — full width */}
      <SegmentEngagementCards />

      {/* Product revenue trend — full width */}
      <ProductRevenueTrend />

      {/* Cohort table — full width */}
      <CohortTable />
    </div>
  );
}
