"use client";

import { Card, CardHeader } from "@/components/ui/Card";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import type { IngestionJob } from "@/types";

const DEMO_JOBS: IngestionJob[] = [
  { jobId: "job-001", orgId: "org-1", dataSource: "Shopify Sales Feed", status: "complete", recordCount: 1240, failedCount: 2, createdAt: "2026-04-04T08:00:00Z", completedAt: "2026-04-04T08:01:30Z" },
  { jobId: "job-002", orgId: "org-1", dataSource: "Monthly CSV Upload", status: "processing", recordCount: 3800, createdAt: "2026-04-04T09:15:00Z" },
  { jobId: "job-003", orgId: "org-1", dataSource: "CRM REST API", status: "failed", createdAt: "2026-04-03T06:00:00Z", errorMessage: "Connection timeout after 30s" },
  { jobId: "job-004", orgId: "org-1", dataSource: "Shopify Sales Feed", status: "complete", recordCount: 980, failedCount: 0, createdAt: "2026-04-03T08:00:00Z", completedAt: "2026-04-03T08:01:05Z" },
  { jobId: "job-005", orgId: "org-1", dataSource: "Review Scraper Feed", status: "pending", createdAt: "2026-04-04T09:30:00Z" },
];

const STATUS_STYLES: Record<IngestionJob["status"], string> = {
  complete: "bg-[#2D9E6B]/10 text-[#2D9E6B]",
  processing: "bg-[#0A66C2]/10 text-[#0A66C2]",
  failed: "bg-[#CC3333]/10 text-[#CC3333]",
  pending: "bg-[#E8940A]/10 text-[#E8940A]",
};

export function IngestionMonitor() {
  const stats = {
    total: DEMO_JOBS.length,
    complete: DEMO_JOBS.filter((j) => j.status === "complete").length,
    processing: DEMO_JOBS.filter((j) => j.status === "processing").length,
    failed: DEMO_JOBS.filter((j) => j.status === "failed").length,
  };

  return (
    <div className="space-y-6">
      {/* Health stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Jobs", value: stats.total, color: "border-l-[#0A66C2]" },
          { label: "Completed", value: stats.complete, color: "border-l-[#2D9E6B]" },
          { label: "Processing", value: stats.processing, color: "border-l-[#0A66C2]" },
          { label: "Failed", value: stats.failed, color: "border-l-[#CC3333]" },
        ].map((s) => (
          <div key={s.label} className={`bg-white rounded-lg border border-[#D9D8D3] border-l-4 ${s.color} p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)]`}>
            <p className="text-[12px] font-medium text-[#6B7280] uppercase tracking-wide mb-1">{s.label}</p>
            <p className="text-[28px] font-bold text-[#1A1A1A]">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Jobs table */}
      <Card padding={false}>
        <div className="p-6 pb-4">
          <CardHeader title="Recent Jobs" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#D9D8D3]">
                {["Job ID", "Data Source", "Status", "Records", "Started", "Duration", "Error"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A] first:pl-6">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEMO_JOBS.map((job, i) => {
                const duration = job.completedAt
                  ? Math.round((new Date(job.completedAt).getTime() - new Date(job.createdAt).getTime()) / 1000)
                  : null;
                return (
                  <tr key={job.jobId} className={`border-b border-[#D9D8D3] hover:bg-[#F0F7FF] transition-colors ${i % 2 === 0 ? "bg-white" : "bg-[#F9F9F7]"}`}>
                    <td className="pl-6 pr-4 py-3 font-mono text-[12px] text-[#6B7280]">{job.jobId}</td>
                    <td className="px-4 py-3 font-medium text-[#1A1A1A]">{job.dataSource}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[job.status]}`}>
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#4A4A4A]">
                      {job.recordCount != null ? (
                        <>
                          {job.recordCount.toLocaleString()}
                          {job.failedCount != null && job.failedCount > 0 && (
                            <span className="text-[#CC3333] ml-1">({job.failedCount} failed)</span>
                          )}
                        </>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-[#8A8A8A]">{formatRelativeTime(job.createdAt)}</td>
                    <td className="px-4 py-3 text-[#8A8A8A]">{duration != null ? `${duration}s` : "—"}</td>
                    <td className="px-4 py-3 text-[#CC3333] text-[12px] max-w-[180px] truncate" title={job.errorMessage}>
                      {job.errorMessage ?? "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
