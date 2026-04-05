"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton, TableRowSkeleton } from "@/components/ui/Skeleton";
import { ROLE_LABELS, STATUS_STYLES, formatDate, formatRelativeTime } from "@/lib/utils";
import type { AdminUser, UserRole } from "@/types";

// Placeholder data — replaced when backend is live
const DEMO_USERS: AdminUser[] = [
  { id: "1", name: "Sarah Chen", email: "sarah@democorp.com", role: "admin", status: "active", organizationId: "org-1", createdAt: "2026-01-15T10:00:00Z", lastActiveAt: "2026-04-04T08:30:00Z" },
  { id: "2", name: "Marcus Webb", email: "marcus@democorp.com", role: "analyst", status: "active", organizationId: "org-1", createdAt: "2026-02-01T10:00:00Z", lastActiveAt: "2026-04-03T14:22:00Z" },
  { id: "3", name: "Priya Nair", email: "priya@democorp.com", role: "marketer", status: "active", organizationId: "org-1", createdAt: "2026-02-10T10:00:00Z", lastActiveAt: "2026-04-04T07:15:00Z" },
  { id: "4", name: "Jordan Blake", email: "jordan@democorp.com", role: "viewer", status: "invited", organizationId: "org-1", createdAt: "2026-04-01T10:00:00Z" },
  { id: "5", name: "Tom Hartley", email: "tom@democorp.com", role: "analyst", status: "inactive", organizationId: "org-1", createdAt: "2026-01-20T10:00:00Z", lastActiveAt: "2026-03-10T11:00:00Z" },
];

const ROLE_VARIANT: Record<UserRole, "brand" | "success" | "warning" | "neutral"> = {
  admin: "danger" as never,
  analyst: "brand",
  marketer: "warning",
  viewer: "neutral",
};

export function UsersTable() {
  const [users] = useState<AdminUser[]>(DEMO_USERS);
  const [isLoading] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card padding={false}>
      <div className="p-6 pb-4 flex flex-wrap items-center justify-between gap-3">
        <input
          type="search"
          placeholder="Search users…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 px-3 rounded-[6px] border border-[#D9D8D3] text-[13px] text-[#1A1A1A] bg-white focus:outline-none focus:border-[#0A66C2] w-64"
        />
        <Button variant="primary" size="sm">+ Invite User</Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-[#D9D8D3]">
              {["Name", "Email", "Role", "Status", "Last Active", "Joined", ""].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A] first:pl-6 last:pr-6">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => <TableRowSkeleton key={i} columns={7} />)
              : filtered.map((user, i) => (
                  <tr key={user.id} className={`border-b border-[#D9D8D3] hover:bg-[#F0F7FF] transition-colors ${i % 2 === 0 ? "bg-white" : "bg-[#F9F9F7]"}`}>
                    <td className="pl-6 pr-4 py-3 font-medium text-[#1A1A1A]">{user.name}</td>
                    <td className="px-4 py-3 text-[#4A4A4A]">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={ROLE_VARIANT[user.role] as "brand" | "success" | "warning" | "neutral" | "danger" | "ai"}>
                        {ROLE_LABELS[user.role]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[user.status]}`}>
                        {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#8A8A8A]">
                      {user.lastActiveAt ? formatRelativeTime(user.lastActiveAt) : "—"}
                    </td>
                    <td className="px-4 py-3 text-[#8A8A8A]">{formatDate(user.createdAt)}</td>
                    <td className="pr-6 pl-4 py-3">
                      <button className="text-[#0A66C2] hover:text-[#004182] text-[12px] font-medium">Edit</button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {!isLoading && filtered.length === 0 && (
        <div className="py-12 text-center text-[14px] text-[#8A8A8A]">No users match your search.</div>
      )}
    </Card>
  );
}
