import type { Metadata } from "next";
import { SentimentOverview } from "@/features/sentiment/SentimentOverview";
import { SentimentDonut } from "@/features/sentiment/SentimentDonut";
import { SentimentTrendChart } from "@/features/sentiment/SentimentTrendChart";
import { SentimentVolumeChart } from "@/features/sentiment/SentimentVolumeChart";
import { SentimentBySourceChart } from "@/features/sentiment/SentimentBySourceChart";
import { SentimentByProductChart } from "@/features/sentiment/SentimentByProductChart";
import { SentimentTable } from "@/features/sentiment/SentimentTable";

export const metadata: Metadata = {
  title: "Customer Satisfaction — PulseIQ",
};

export default function SentimentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold text-[#1A1A1A]">Customer Satisfaction</h1>
        <p className="text-[14px] text-[#8A8A8A] mt-1">
          NPS surveys, branch feedback, and app reviews classified by AI — positive, neutral, and negative.
        </p>
      </div>

      {/* Row 0: KPI summary cards */}
      <SentimentOverview />

      {/* Row 1: Distribution donut | Trend over time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SentimentDonut />
        <SentimentTrendChart />
      </div>

      {/* Row 2: Volume over time | By channel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SentimentVolumeChart />
        <SentimentBySourceChart />
      </div>

      {/* Row 3: By product — full width */}
      <SentimentByProductChart />

      {/* Row 4: Detailed table */}
      <SentimentTable />
    </div>
  );
}
