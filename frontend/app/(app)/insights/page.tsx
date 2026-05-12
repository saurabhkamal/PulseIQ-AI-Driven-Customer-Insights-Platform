import type { Metadata } from "next";
import { InsightsList } from "@/features/insights/InsightsList";
import { InsightPriorityDonut } from "@/features/insights/InsightPriorityDonut";
import { InsightsByAgent } from "@/features/insights/InsightsByAgent";
import { InsightPriorityAgentMatrix } from "@/features/insights/InsightPriorityAgentMatrix";
import { InsightVolumeChart } from "@/features/insights/InsightVolumeChart";
import { InsightPriorityTrend } from "@/features/insights/InsightPriorityTrend";

export const metadata: Metadata = {
  title: "AI Insights — PulseIQ",
};

export default function InsightsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[24px] font-semibold text-[#1A1A1A]">AI Insights</h1>
          <p className="text-[14px] text-[#8A8A8A] mt-1">
            Prioritised recommendations for your banking customers — churn prevention, cross-sell, and product acquisition.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded-full px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" aria-hidden="true" />
          <span className="text-[12px] font-medium text-[#7C3AED]">GPT-4o powered</span>
        </div>
      </div>

      {/* Row 1: Priority donut + Insights by agent */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InsightPriorityDonut />
        <InsightsByAgent />
      </div>

      {/* Row 2: Priority × Agent matrix — full width */}
      <InsightPriorityAgentMatrix />

      {/* Row 3: Volume over time + Priority trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <InsightVolumeChart />
        <InsightPriorityTrend />
      </div>

      {/* Row 4: Insights list */}
      <InsightsList />
    </div>
  );
}
