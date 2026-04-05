import type { Metadata } from "next";
import { AuditLogTable } from "@/features/audit-logs/AuditLogTable";

export const metadata: Metadata = { title: "Audit Logs — PulseIQ Admin" };

export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold text-[#1A1A1A]">Audit Logs</h1>
        <p className="text-[14px] text-[#8A8A8A] mt-1">Immutable log of all user-initiated actions for compliance and security review.</p>
      </div>
      <AuditLogTable />
    </div>
  );
}
