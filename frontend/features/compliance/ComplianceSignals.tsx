"use client";

import { useState } from "react";
import { useComplianceSignals } from "@/hooks/useComplianceSignals";
import { Card } from "@/components/ui/Card";
import { Skeleton, TableRowSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatDate } from "@/lib/utils";
import type { ComplianceSeverity } from "@/types";

const SEVERITY_STYLES: Record<ComplianceSeverity, string> = {
  high: "text-[#CC3333] bg-[#CC3333]/10",
  medium: "text-[#E8940A] bg-[#E8940A]/10",
  low: "text-[#6B7280] bg-[#6B7280]/10",
  none: "text-[#6B7280] bg-[#6B7280]/10",
};

const SIGNAL_TYPE_LABELS: Record<string, string> = {
  vulnerable_customer_cluster: "Vulnerable Customer Cluster",
  complaint_spike: "Complaint Spike",
  poor_outcome_indicator: "Poor Outcome Indicator",
  consumer_duty_alert: "Consumer Duty Alert",
  tcf_breach_signal: "TCF Breach Signal",
  psd2_consent_issue: "PSD2 Consent Issue",
  none_detected: "None Detected",
};

const SEVERITY_FILTERS: { label: string; value: "all" | ComplianceSeverity }[] = [
  { label: "All", value: "all" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

const PAGE_SIZE = 20;

export function ComplianceSignals() {
  const [severityFilter, setSeverityFilter] = useState<"all" | ComplianceSeverity>("all");
  const [reviewedFilter, setReviewedFilter] = useState<"all" | "reviewed" | "unreviewed">("all");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const { signals, isLoading, error, total, totalPages } = useComplianceSignals({
    page,
    pageSize: PAGE_SIZE,
    severity: severityFilter === "all" ? undefined : severityFilter,
    reviewed:
      reviewedFilter === "reviewed" ? true : reviewedFilter === "unreviewed" ? false : undefined,
  });

  function handleSeverityChange(val: "all" | ComplianceSeverity) {
    setSeverityFilter(val);
    setPage(1);
  }

  function handleReviewedChange(val: "all" | "reviewed" | "unreviewed") {
    setReviewedFilter(val);
    setPage(1);
  }

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      {!isLoading && !error && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {(["high", "medium", "low"] as ComplianceSeverity[]).map((sev) => {
            const count = signals.filter((s) => s.severity === sev).length;
            return (
              <button
                key={sev}
                onClick={() =>
                  handleSeverityChange(severityFilter === sev ? "all" : sev)
                }
                className={`flex flex-col items-start p-4 bg-white rounded-[8px] border transition-all shadow-[0_1px_3px_rgba(0,0,0,0.08)] ${
                  severityFilter === sev
                    ? "border-[#0A66C2] ring-1 ring-[#0A66C2]"
                    : "border-[#D9D8D3] hover:border-[#0A66C2]/40"
                }`}
              >
                <span className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded ${SEVERITY_STYLES[sev]}`}>
                  {sev}
                </span>
                <span className="mt-2 text-[28px] font-bold text-[#1A1A1A]">
                  {signals.filter((s) => s.severity === sev).length}
                </span>
                <span className="text-[12px] text-[#8A8A8A]">signals</span>
              </button>
            );
          })}
          <div className="flex flex-col items-start p-4 bg-white rounded-[8px] border border-[#D9D8D3] shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
            <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded text-[#2D9E6B] bg-[#2D9E6B]/10">
              Reviewed
            </span>
            <span className="mt-2 text-[28px] font-bold text-[#1A1A1A]">
              {signals.filter((s) => s.reviewed).length}
            </span>
            <span className="text-[12px] text-[#8A8A8A]">of {total}</span>
          </div>
        </div>
      )}

      {/* Signals table */}
      <Card padding={false}>
        <div className="p-6 pb-4 flex flex-wrap items-center justify-between gap-3">
          <h3 className="text-[15px] font-semibold text-[#1A1A1A]">
            Regulatory Signals
            {!isLoading && total > 0 && (
              <span className="ml-2 text-[13px] font-normal text-[#8A8A8A]">
                ({total} total)
              </span>
            )}
          </h3>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Severity filter */}
            <div className="flex items-center gap-1 bg-[#F3F2EF] border border-[#D9D8D3] rounded-lg p-1">
              {SEVERITY_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => handleSeverityChange(f.value)}
                  className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors ${
                    severityFilter === f.value
                      ? "bg-white text-[#1A1A1A] shadow-sm"
                      : "text-[#4A4A4A] hover:bg-white/60"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Reviewed filter */}
            <div className="flex items-center gap-1 bg-[#F3F2EF] border border-[#D9D8D3] rounded-lg p-1">
              {(["all", "unreviewed", "reviewed"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => handleReviewedChange(v)}
                  className={`px-3 py-1 rounded-md text-[12px] font-medium transition-colors capitalize ${
                    reviewedFilter === v
                      ? "bg-white text-[#1A1A1A] shadow-sm"
                      : "text-[#4A4A4A] hover:bg-white/60"
                  }`}
                >
                  {v === "all" ? "All" : v === "reviewed" ? "Reviewed" : "Pending"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {isLoading && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#D9D8D3]">
                  {["Severity", "Signal Type", "Description", "Regulatory Ref", "Detected", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left">
                      <Skeleton className="h-3 w-20" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 5 }).map((_, i) => (
                  <TableRowSkeleton key={i} columns={6} />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {error && !isLoading && (
          <div className="p-6">
            <EmptyState title="Could not load signals" description="Compliance signal data is temporarily unavailable." />
          </div>
        )}

        {!isLoading && !error && signals.length === 0 && (
          <div className="p-6">
            <EmptyState
              title="No signals detected"
              description={
                severityFilter !== "all"
                  ? `No ${severityFilter}-severity signals found.`
                  : "No compliance signals have been detected for your organisation."
              }
            />
          </div>
        )}

        {!isLoading && !error && signals.length > 0 && (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[#D9D8D3] bg-white">
                    {[
                      { label: "Severity", align: "left", cls: "pl-6" },
                      { label: "Signal Type", align: "left", cls: "" },
                      { label: "Affected Population", align: "left", cls: "" },
                      { label: "Regulatory Ref", align: "left", cls: "" },
                      { label: "Detected", align: "left", cls: "" },
                      { label: "Status", align: "center", cls: "pr-6" },
                    ].map((col) => (
                      <th
                        key={col.label}
                        className={`px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A] text-${col.align} ${col.cls}`}
                      >
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {signals.map((signal, i) => (
                    <>
                      <tr
                        key={signal.id}
                        onClick={() => setExpanded(expanded === signal.id ? null : signal.id)}
                        className={`border-b border-[#D9D8D3] cursor-pointer hover:bg-[#F0F7FF] transition-colors ${
                          i % 2 === 0 ? "bg-white" : "bg-[#F9F9F7]"
                        }`}
                      >
                        <td className="pl-6 px-4 py-3">
                          <span
                            className={`inline-flex items-center rounded px-2.5 py-1 text-[11px] font-semibold ${SEVERITY_STYLES[signal.severity]}`}
                          >
                            {signal.severity.charAt(0).toUpperCase() + signal.severity.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-medium text-[#1A1A1A]">
                          {SIGNAL_TYPE_LABELS[signal.signalType] ?? signal.signalType}
                        </td>
                        <td className="px-4 py-3 text-[#4A4A4A]">
                          {signal.affectedPopulationEstimate ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-[#6B7280] font-mono text-[12px]">
                          {signal.regulatoryReference ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-[#8A8A8A]">
                          {formatDate(signal.generatedAt)}
                        </td>
                        <td className="pr-6 px-4 py-3 text-center">
                          <span
                            className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${
                              signal.reviewed
                                ? "text-[#2D9E6B] bg-[#2D9E6B]/10"
                                : "text-[#E8940A] bg-[#E8940A]/10"
                            }`}
                          >
                            {signal.reviewed ? "Reviewed" : "Pending"}
                          </span>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {expanded === signal.id && (
                        <tr
                          key={`${signal.id}-detail`}
                          className={i % 2 === 0 ? "bg-white" : "bg-[#F9F9F7]"}
                        >
                          <td colSpan={6} className="px-6 pb-4 pt-0">
                            <div className="border border-[#D9D8D3] rounded-[8px] p-4 bg-[#F3F2EF] space-y-3">
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A] mb-1">
                                  Description
                                </p>
                                <p className="text-[13px] text-[#4A4A4A]">{signal.description}</p>
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A] mb-1">
                                  Recommended Action
                                </p>
                                <p className="text-[13px] text-[#4A4A4A]">
                                  {signal.recommendedReviewAction}
                                </p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-6 py-4 border-t border-[#D9D8D3]">
                <p className="text-[13px] text-[#8A8A8A]">
                  Page {page} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-8 px-3 rounded-[6px] border border-[#D9D8D3] text-[13px] font-medium text-[#4A4A4A] hover:bg-[#EAE9E4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="h-8 px-3 rounded-[6px] border border-[#D9D8D3] text-[13px] font-medium text-[#4A4A4A] hover:bg-[#EAE9E4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
