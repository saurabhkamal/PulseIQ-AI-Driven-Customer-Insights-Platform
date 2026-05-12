"use client";

import Link from "next/link";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { Skeleton } from "@/components/ui/Skeleton";

export function ComplianceAlertWidget() {
  const { data, isLoading, error } = useDashboardSummary();

  if (isLoading) {
    return (
      <div className="bg-white border border-[#D9D8D3] rounded-xl p-5 shadow-sm border-l-4 border-l-[#CC3333]">
        <Skeleton className="h-4 w-36 mb-3" />
        <Skeleton className="h-10 w-16 mb-2" />
        <Skeleton className="h-3 w-full" />
      </div>
    );
  }

  const alerts = data?.compliance_alerts ?? {
    high_unreviewed: 0,
    medium_unreviewed: 0,
    low_unreviewed: 0,
    total_unreviewed: 0,
  };

  const hasAlerts = alerts.total_unreviewed > 0;
  const urgent = alerts.high_unreviewed > 0;

  return (
    <div
      className={`bg-white border rounded-xl p-5 shadow-sm border-l-4 ${
        urgent ? "border-l-[#CC3333]" : alerts.medium_unreviewed > 0 ? "border-l-[#E8940A]" : "border-l-[#D9D8D3]"
      } border-[#D9D8D3]`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-[#CC3333] flex-shrink-0" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <h3 className="text-[15px] font-semibold text-[#1A1A1A]">Compliance Alerts</h3>
        </div>
        <Link
          href="/compliance"
          className="text-[12px] text-[#0A66C2] hover:text-[#004182] font-medium transition-colors flex-shrink-0"
        >
          Review →
        </Link>
      </div>

      {!hasAlerts && !error ? (
        <div className="text-center py-3">
          <div className="text-[28px] mb-1">✓</div>
          <p className="text-[13px] text-[#2D9E6B] font-medium">All signals reviewed</p>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-1 mb-3">
            <span className={`text-[36px] font-bold leading-none ${urgent ? "text-[#CC3333]" : "text-[#E8940A]"}`}>
              {alerts.total_unreviewed}
            </span>
            <span className="text-[13px] text-[#8A8A8A]">unreviewed</span>
          </div>

          <div className="space-y-1.5">
            {alerts.high_unreviewed > 0 && (
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[12px] text-[#CC3333] font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#CC3333] inline-block" />
                  High severity
                </span>
                <span className="text-[13px] font-semibold text-[#CC3333]">{alerts.high_unreviewed}</span>
              </div>
            )}
            {alerts.medium_unreviewed > 0 && (
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[12px] text-[#E8940A] font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#E8940A] inline-block" />
                  Medium severity
                </span>
                <span className="text-[13px] font-semibold text-[#E8940A]">{alerts.medium_unreviewed}</span>
              </div>
            )}
            {alerts.low_unreviewed > 0 && (
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[12px] text-[#6B7280] font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#6B7280] inline-block" />
                  Low severity
                </span>
                <span className="text-[13px] font-semibold text-[#6B7280]">{alerts.low_unreviewed}</span>
              </div>
            )}
          </div>

          <p className="text-[11px] text-[#8A8A8A] mt-3 border-t border-[#EAE9E4] pt-2">
            FCA / TCF / PSD2 regulatory signals
          </p>
        </>
      )}
    </div>
  );
}
