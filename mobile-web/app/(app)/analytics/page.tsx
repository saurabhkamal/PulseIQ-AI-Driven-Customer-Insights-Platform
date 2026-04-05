import type { Metadata } from "next";
import { MobileAnalytics } from "@/features/analytics/MobileAnalytics";

export const metadata: Metadata = { title: "Analytics — PulseIQ" };

export default function AnalyticsPage() {
  return <MobileAnalytics />;
}
