import type { Metadata } from "next";
import { BehaviorVisualizations } from "@/features/analytics/BehaviorVisualizations";
import { ActivityHeatmap } from "@/features/analytics/ActivityHeatmap";
import { CohortTable } from "@/features/analytics/CohortTable";

export const metadata: Metadata = {
  title: "Behavior Analytics — PulseIQ",
};

export default function BehaviorPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-[24px] font-semibold text-[#1A1A1A]">Behavior Analytics</h1>
        <p className="text-[14px] text-[#8A8A8A] mt-1">
          Conversion funnels, cohort retention, and activity patterns.
        </p>
      </div>

      {/* Stats strip + SVG funnel + retention curve */}
      <BehaviorVisualizations />

      {/* Activity heatmap */}
      <ActivityHeatmap />

      {/* Cohort retention detail table */}
      <div style={{ borderTop: "1px solid #D9D8D3", paddingTop: "8px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#1A1A1A", marginBottom: "16px" }}>
          Cohort Retention Detail
        </h2>
        <CohortTable />
      </div>
    </div>
  );
}
