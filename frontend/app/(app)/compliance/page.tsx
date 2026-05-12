import type { Metadata } from "next";
import { ComplianceSignals } from "@/features/compliance/ComplianceSignals";

export const metadata: Metadata = {
  title: "Compliance Signals — PulseIQ",
};

export default function CompliancePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[24px] font-semibold text-[#1A1A1A]">Compliance Signals</h1>
          <p className="text-[14px] text-[#8A8A8A] mt-1">
            FCA Consumer Duty, TCF, and PSD2 signals detected from your customer data.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#CC3333]/10 border border-[#CC3333]/20 rounded-full px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#CC3333]" aria-hidden="true" />
          <span className="text-[12px] font-medium text-[#CC3333]">Regulatory monitoring</span>
        </div>
      </div>
      <ComplianceSignals />
    </div>
  );
}
