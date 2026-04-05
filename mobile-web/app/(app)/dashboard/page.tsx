import type { Metadata } from "next";
import { MobileDashboard } from "@/features/dashboard/MobileDashboard";

export const metadata: Metadata = { title: "Dashboard — PulseIQ" };

export default function DashboardPage() {
  return <MobileDashboard />;
}
