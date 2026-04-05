import type { Metadata } from "next";
import { FunnelChart } from "@/features/analytics/FunnelChart";
import { CohortTable } from "@/features/analytics/CohortTable";
import { ActivityHeatmap } from "@/features/analytics/ActivityHeatmap";

export const metadata: Metadata = {
  title: "Behavior Analytics — PulseIQ",
};

export default function BehaviorPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold text-[#1A1A1A]">Behavior Analytics</h1>
        <p className="text-[14px] text-[#8A8A8A] mt-1">
          Conversion funnels, cohort retention, and activity patterns.
        </p>
      </div>

      {/* Funnel + Heatmap row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <FunnelChart />
        <ActivityHeatmap />
      </div>

      {/* Cohort table full width */}
      <CohortTable />
    </div>
  );
}
