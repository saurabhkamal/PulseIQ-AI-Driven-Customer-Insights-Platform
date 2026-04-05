import type { Metadata } from "next";
import { ExportForm } from "@/features/export/ExportForm";

export const metadata: Metadata = {
  title: "Export — PulseIQ",
};

export default function ExportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold text-[#1A1A1A]">Export Data</h1>
        <p className="text-[14px] text-[#8A8A8A] mt-1">
          Download your data and AI-generated reports in CSV, Excel, or JSON format.
        </p>
      </div>
      <ExportForm />
    </div>
  );
}
