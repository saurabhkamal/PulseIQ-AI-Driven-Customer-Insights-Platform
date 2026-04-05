import type { Metadata } from "next";
import { MobileInsights } from "@/features/insights/MobileInsights";

export const metadata: Metadata = { title: "Insights — PulseIQ" };

export default function InsightsPage() {
  return <MobileInsights />;
}
