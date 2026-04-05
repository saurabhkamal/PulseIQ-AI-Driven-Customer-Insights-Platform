"use client";

import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatDate, formatRelativeTime } from "@/lib/utils";
import type { ApiKey } from "@/types";

const DEMO_KEYS: ApiKey[] = [
  { id: "1", name: "Production Integration", keyPrefix: "piq_live_a3f8", organizationId: "org-1", createdAt: "2026-01-10T10:00:00Z", lastUsedAt: "2026-04-04T07:12:00Z", isActive: true },
  { id: "2", name: "Staging Environment", keyPrefix: "piq_stg_c7b2", organizationId: "org-1", createdAt: "2026-02-01T10:00:00Z", lastUsedAt: "2026-04-03T15:44:00Z", isActive: true },
  { id: "3", name: "Old Dashboard (deprecated)", keyPrefix: "piq_live_x9d1", organizationId: "org-1", createdAt: "2025-11-01T10:00:00Z", lastUsedAt: "2026-03-01T10:00:00Z", isActive: false },
];

export function ApiKeysList() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Organization API Keys"
          action={<Button variant="primary" size="sm">+ Create Key</Button>}
        />
        <div className="rounded-lg border border-[#D9D8D3] overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[#D9D8D3] bg-[#F3F2EF]">
                {["Name", "Key Prefix", "Status", "Last Used", "Created", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A] first:pl-5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DEMO_KEYS.map((key, i) => (
                <tr key={key.id} className={`border-b border-[#D9D8D3] last:border-0 ${i % 2 === 0 ? "bg-white" : "bg-[#F9F9F7]"}`}>
                  <td className="pl-5 pr-4 py-3 font-medium text-[#1A1A1A]">{key.name}</td>
                  <td className="px-4 py-3 font-mono text-[12px] text-[#4A4A4A]">{key.keyPrefix}…</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${key.isActive ? "bg-[#2D9E6B]/10 text-[#2D9E6B]" : "bg-[#6B7280]/10 text-[#6B7280]"}`}>
                      {key.isActive ? "Active" : "Revoked"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[#8A8A8A]">{key.lastUsedAt ? formatRelativeTime(key.lastUsedAt) : "Never"}</td>
                  <td className="px-4 py-3 text-[#8A8A8A]">{formatDate(key.createdAt)}</td>
                  <td className="px-4 py-3">
                    {key.isActive && (
                      <button className="text-[#CC3333] hover:text-[#a82828] text-[12px] font-medium transition-colors">
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[12px] text-[#8A8A8A] mt-4">
          API keys are shown in prefix form only. Full key is displayed once at creation and cannot be retrieved.
        </p>
      </Card>
    </div>
  );
}
