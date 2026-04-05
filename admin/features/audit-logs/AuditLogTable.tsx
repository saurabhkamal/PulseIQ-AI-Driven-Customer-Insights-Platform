"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import type { AuditLogEntry } from "@/types";

const DEMO_LOGS: AuditLogEntry[] = [
  { id: "1", userId: "u-1", userEmail: "sarah@democorp.com", action: "user.invite", resourceType: "user", resourceId: "u-4", organizationId: "org-1", createdAt: "2026-04-04T09:30:00Z", ipAddress: "203.0.113.10" },
  { id: "2", userId: "u-1", userEmail: "sarah@democorp.com", action: "api_key.create", resourceType: "api_key", resourceId: "k-2", organizationId: "org-1", createdAt: "2026-04-04T09:00:00Z", ipAddress: "203.0.113.10" },
  { id: "3", userId: "u-2", userEmail: "marcus@democorp.com", action: "export.request", resourceType: "export", organizationId: "org-1", createdAt: "2026-04-04T08:45:00Z", ipAddress: "198.51.100.22" },
  { id: "4", userId: "u-1", userEmail: "sarah@democorp.com", action: "data_source.update", resourceType: "data_source", resourceId: "ds-1", organizationId: "org-1", createdAt: "2026-04-03T14:20:00Z", ipAddress: "203.0.113.10" },
  { id: "5", userId: "u-3", userEmail: "priya@democorp.com", action: "insights.refresh", resourceType: "insights", organizationId: "org-1", createdAt: "2026-04-03T11:10:00Z", ipAddress: "192.0.2.55" },
  { id: "6", userId: "u-1", userEmail: "sarah@democorp.com", action: "user.role_change", resourceType: "user", resourceId: "u-3", organizationId: "org-1", createdAt: "2026-04-02T10:00:00Z", ipAddress: "203.0.113.10" },
];

export function AuditLogTable() {
  const [search, setSearch] = useState("");

  const filtered = DEMO_LOGS.filter(
    (l) =>
      l.userEmail.includes(search) ||
      l.action.includes(search) ||
      l.resourceType.includes(search)
  );

  return (
    <Card padding={false}>
      <div className="p-6 pb-4 flex items-center justify-between gap-3">
        <input
          type="search"
          placeholder="Filter by user, action, or resource…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 px-3 rounded-[6px] border border-[#D9D8D3] text-[13px] bg-white focus:outline-none focus:border-[#0A66C2] w-72"
        />
        <p className="text-[12px] text-[#8A8A8A]">Read-only · append-only log</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#D9D8D3]">
              {["Timestamp", "User", "Action", "Resource", "IP Address"].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A] first:pl-6">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((log, i) => (
              <tr key={log.id} className={`border-b border-[#D9D8D3] hover:bg-[#F0F7FF] transition-colors ${i % 2 === 0 ? "bg-white" : "bg-[#F9F9F7]"}`}>
                <td className="pl-6 pr-4 py-3 text-[#8A8A8A]" title={formatDate(log.createdAt)}>
                  {formatRelativeTime(log.createdAt)}
                </td>
                <td className="px-4 py-3 text-[#4A4A4A]">{log.userEmail}</td>
                <td className="px-4 py-3 font-mono text-[12px] text-[#0A66C2]">{log.action}</td>
                <td className="px-4 py-3 text-[#4A4A4A]">
                  {log.resourceType}
                  {log.resourceId && <span className="ml-1 text-[#8A8A8A] font-mono text-[11px]">#{log.resourceId}</span>}
                </td>
                <td className="px-4 py-3 font-mono text-[12px] text-[#8A8A8A]">{log.ipAddress ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="py-10 text-center text-[14px] text-[#8A8A8A]">No logs match your filter.</div>
      )}
    </Card>
  );
}
