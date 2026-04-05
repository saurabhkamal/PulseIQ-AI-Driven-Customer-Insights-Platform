import type { Metadata } from "next";
import { DataSourcesList } from "@/features/data-sources/DataSourcesList";

export const metadata: Metadata = { title: "Data Sources — PulseIQ Admin" };

export default function DataSourcesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[24px] font-semibold text-[#1A1A1A]">Data Sources</h1>
          <p className="text-[14px] text-[#8A8A8A] mt-1">Configure and monitor your ingestion data connections.</p>
        </div>
      </div>
      <DataSourcesList />
    </div>
  );
}
