import type { Metadata } from "next";
import { IngestionMonitor } from "@/features/ingestion-monitor/IngestionMonitor";

export const metadata: Metadata = { title: "Ingestion Monitor — PulseIQ Admin" };

export default function IngestionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold text-[#1A1A1A]">Ingestion Monitor</h1>
        <p className="text-[14px] text-[#8A8A8A] mt-1">Track ETL pipeline jobs, ingestion health, and processing status.</p>
      </div>
      <IngestionMonitor />
    </div>
  );
}
