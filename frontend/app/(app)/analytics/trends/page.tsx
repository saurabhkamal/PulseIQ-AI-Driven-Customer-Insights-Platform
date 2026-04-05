import type { Metadata } from "next";
import { TrendsList } from "@/features/analytics/TrendsList";

export const metadata: Metadata = {
  title: "Trend Predictions — PulseIQ",
};

export default function TrendsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[24px] font-semibold text-[#1A1A1A]">Trend Predictions</h1>
          <p className="text-[14px] text-[#8A8A8A] mt-1">
            AI-forecasted emerging product and market trends for your organization.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded-full px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" aria-hidden="true" />
          <span className="text-[12px] font-medium text-[#7C3AED]">GPT-4o powered</span>
        </div>
      </div>
      <TrendsList />
    </div>
  );
}
