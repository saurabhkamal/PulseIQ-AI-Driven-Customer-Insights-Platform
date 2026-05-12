import type { Metadata } from "next";
import { KpiGrid } from "@/features/dashboard/KpiGrid";
import { RevenueTrendChart } from "@/features/dashboard/RevenueTrendChart";
import { ComplianceAlertWidget } from "@/features/dashboard/ComplianceAlertWidget";
import { TopProductsWidget } from "@/features/dashboard/TopProductsWidget";
import { ChurnRiskSnapshot } from "@/features/dashboard/ChurnRiskSnapshot";
import { InsightsSummaryCard } from "@/features/dashboard/InsightsSummaryCard";
import { SentimentSummaryCard } from "@/features/dashboard/SentimentSummaryCard";
import { TopTrendsCard } from "@/features/dashboard/TopTrendsCard";
import { NetSentimentScoreCard } from "@/features/dashboard/NetSentimentScoreCard";
import { NewVsReturningWidget } from "@/features/dashboard/NewVsReturningWidget";
import { FunnelHealthCard } from "@/features/dashboard/FunnelHealthCard";
import { PipelineStatusCard } from "@/features/dashboard/PipelineStatusCard";

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
          Your organisation&apos;s key metrics, AI signals, and pipeline health at a glance.
        </p>
      </div>

      {/* Row 1: KPI metric cards */}
      <KpiGrid />

      {/* Row 2: Revenue trend (hero) + Compliance alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RevenueTrendChart />
        </div>
        <div>
          <ComplianceAlertWidget />
        </div>
      </div>

      {/* Row 3: Top products | Churn risk | Net sentiment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <TopProductsWidget />
        <ChurnRiskSnapshot />
        <NetSentimentScoreCard />
      </div>

      {/* Row 4: AI insights (2/3) | Sentiment summary (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <InsightsSummaryCard />
        </div>
        <div>
          <SentimentSummaryCard />
        </div>
      </div>

      {/* Row 5: New vs Returning | Funnel health | Top trends | Pipeline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <NewVsReturningWidget />
        <FunnelHealthCard />
        <TopTrendsCard />
        <PipelineStatusCard />
      </div>
    </div>
  );
}
