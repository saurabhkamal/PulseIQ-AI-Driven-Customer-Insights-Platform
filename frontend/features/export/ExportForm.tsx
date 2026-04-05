"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { exportService } from "@/services/export.service";
import type { ExportDataType, ExportFormat, ExportJob } from "@/services/export.service";
import { formatDate } from "@/lib/utils";

const DATA_TYPES: { value: ExportDataType; label: string; description: string }[] = [
  { value: "sales", label: "Sales Data", description: "Transactional sales records with product and revenue breakdown" },
  { value: "customers", label: "Customer Data", description: "Customer profiles, segments, and lifecycle metadata" },
  { value: "products", label: "Product Catalog", description: "Product listings, categories, and attributes" },
  { value: "insights", label: "AI Insights", description: "All AI-generated recommendations and their supporting data" },
  { value: "sentiment", label: "Sentiment Results", description: "Classified feedback with scores and product associations" },
  { value: "trends", label: "Trend Predictions", description: "AI-forecasted trends with confidence and signal data" },
];

const FORMATS: { value: ExportFormat; label: string; icon: string }[] = [
  { value: "csv", label: "CSV", icon: "📄" },
  { value: "xlsx", label: "Excel (.xlsx)", icon: "📊" },
  { value: "json", label: "JSON", icon: "{ }" },
];

export function ExportForm() {
  const [dataType, setDataType] = useState<ExportDataType>("sales");
  const [format, setFormat] = useState<ExportFormat>("csv");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [job, setJob] = useState<ExportJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setIsLoading(true);
    setError(null);
    setJob(null);
    try {
      const result = await exportService.requestExport({
        dataType,
        format,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      });
      setJob(result);
    } catch {
      setError("Export request failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Configuration panel */}
      <div className="lg:col-span-2 space-y-6">
        {/* Data type selection */}
        <Card>
          <CardHeader title="Select Data" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {DATA_TYPES.map((dt) => (
              <button
                key={dt.value}
                onClick={() => setDataType(dt.value)}
                className={`text-left p-4 rounded-lg border-2 transition-colors ${
                  dataType === dt.value
                    ? "border-[#0A66C2] bg-[#0A66C2]/5"
                    : "border-[#D9D8D3] hover:border-[#0A66C2]/40 bg-white"
                }`}
              >
                <p className={`text-[14px] font-semibold mb-1 ${dataType === dt.value ? "text-[#0A66C2]" : "text-[#1A1A1A]"}`}>
                  {dt.label}
                </p>
                <p className="text-[12px] text-[#8A8A8A] leading-relaxed">{dt.description}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Format + date range */}
        <Card>
          <CardHeader title="Export Options" />
          <div className="space-y-5">
            {/* Format */}
            <div>
              <label className="block text-[13px] font-semibold text-[#1A1A1A] mb-2">
                File Format
              </label>
              <div className="flex gap-3">
                {FORMATS.map((f) => (
                  <button
                    key={f.value}
                    onClick={() => setFormat(f.value)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-[6px] border-2 text-[13px] font-medium transition-colors ${
                      format === f.value
                        ? "border-[#0A66C2] bg-[#0A66C2]/5 text-[#0A66C2]"
                        : "border-[#D9D8D3] text-[#4A4A4A] hover:border-[#0A66C2]/40"
                    }`}
                  >
                    <span>{f.icon}</span>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Date range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="date-from" className="block text-[13px] font-semibold text-[#1A1A1A] mb-1.5">
                  From date <span className="text-[#8A8A8A] font-normal">(optional)</span>
                </label>
                <input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full h-10 px-3 rounded-[6px] border border-[#D9D8D3] text-[14px] text-[#1A1A1A] bg-white focus:outline-none focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20 transition-colors"
                />
              </div>
              <div>
                <label htmlFor="date-to" className="block text-[13px] font-semibold text-[#1A1A1A] mb-1.5">
                  To date <span className="text-[#8A8A8A] font-normal">(optional)</span>
                </label>
                <input
                  id="date-to"
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full h-10 px-3 rounded-[6px] border border-[#D9D8D3] text-[14px] text-[#1A1A1A] bg-white focus:outline-none focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20 transition-colors"
                />
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Summary + action panel */}
      <div className="space-y-4">
        <Card>
          <CardHeader title="Export Summary" />
          <div className="space-y-3 text-[13px]">
            <div className="flex justify-between">
              <span className="text-[#8A8A8A]">Dataset</span>
              <span className="font-medium text-[#1A1A1A]">
                {DATA_TYPES.find((d) => d.value === dataType)?.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8A8A8A]">Format</span>
              <span className="font-medium text-[#1A1A1A]">
                {FORMATS.find((f) => f.value === format)?.label}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8A8A8A]">Date range</span>
              <span className="font-medium text-[#1A1A1A]">
                {dateFrom && dateTo
                  ? `${formatDate(dateFrom)} – ${formatDate(dateTo)}`
                  : dateFrom
                  ? `From ${formatDate(dateFrom)}`
                  : dateTo
                  ? `Until ${formatDate(dateTo)}`
                  : "All time"}
              </span>
            </div>
          </div>

          <div className="mt-5 pt-4 border-t border-[#D9D8D3]">
            <Button
              variant="primary"
              size="md"
              isLoading={isLoading}
              onClick={handleExport}
              className="w-full"
            >
              Request Export
            </Button>
            <p className="text-[11px] text-[#8A8A8A] text-center mt-2">
              Large exports are processed asynchronously and emailed when ready.
            </p>
          </div>
        </Card>

        {/* Job result */}
        {error && (
          <div className="rounded-[6px] bg-[#CC3333]/10 border border-[#CC3333]/30 px-4 py-3 text-[13px] text-[#CC3333]">
            {error}
          </div>
        )}

        {job && (
          <Card>
            <p className="text-[13px] font-semibold text-[#1A1A1A] mb-3">Export Queued</p>
            <div className="space-y-2 text-[12px]">
              <div className="flex justify-between">
                <span className="text-[#8A8A8A]">Job ID</span>
                <span className="font-mono text-[#4A4A4A]">{job.jobId.slice(0, 12)}…</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A8A8A]">Status</span>
                <span className={`font-medium capitalize ${
                  job.status === "complete" ? "text-[#2D9E6B]" :
                  job.status === "failed" ? "text-[#CC3333]" : "text-[#E8940A]"
                }`}>
                  {job.status}
                </span>
              </div>
            </div>
            {job.downloadUrl && (
              <a
                href={job.downloadUrl}
                className="mt-4 flex items-center justify-center gap-2 h-9 w-full rounded-[6px] bg-[#2D9E6B] text-white text-[13px] font-medium hover:bg-[#247d55] transition-colors"
              >
                ↓ Download File
              </a>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}
