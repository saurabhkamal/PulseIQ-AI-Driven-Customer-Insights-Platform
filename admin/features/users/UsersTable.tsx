"use client";

import { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TableRowSkeleton } from "@/components/ui/Skeleton";
import { ROLE_LABELS, STATUS_STYLES, formatDate, formatRelativeTime } from "@/lib/utils";
import { listUsers } from "@/services/users";
import type { AdminUser, UserRole } from "@/types";

const ROLE_VARIANT: Record<UserRole, "brand" | "success" | "warning" | "neutral" | "danger" | "ai"> = {
  admin: "danger",
  analyst: "brand",
  marketer: "warning",
  viewer: "neutral",
};

export function UsersTable() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const PAGE_SIZE = 20;

  const fetchUsers = useCallback(async (currentPage: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await listUsers(currentPage, PAGE_SIZE);
      setUsers(res.data);
      setTotalPages(res.meta.totalPages);
      setTotal(res.meta.total);
    } catch (err: unknown) {
      const msg = (err as { message?: string })?.message;
      setError(msg ?? "Failed to load users.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(page);
  }, [fetchUsers, page]);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card padding={false}>
      <div className="p-6 pb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <input
            type="search"
            placeholder="Search users…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 px-3 rounded-[6px] border border-[#D9D8D3] text-[13px] text-[#1A1A1A] bg-white focus:outline-none focus:border-[#0A66C2] w-64"
          />
          {!isLoading && (
            <span className="text-[12px] text-[#8A8A8A]">{total} users</span>
          )}
        </div>
        <Button variant="primary" size="sm">+ Invite User</Button>
      </div>

      {error && (
        <div className="mx-6 mb-4 px-4 py-3 rounded-[6px] bg-[#CC3333]/8 border border-[#CC3333]/20 text-[13px] text-[#CC3333]">
          {error}
        </div>
      )}

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
                  <tr
                    key={user.id}
                    className={`border-b border-[#D9D8D3] hover:bg-[#F0F7FF] transition-colors ${i % 2 === 0 ? "bg-white" : "bg-[#F9F9F7]"}`}
                  >
                    <td className="pl-6 pr-4 py-3 font-medium text-[#1A1A1A]">{user.name}</td>
                    <td className="px-4 py-3 text-[#4A4A4A]">{user.email}</td>
                    <td className="px-4 py-3">
                      <Badge variant={ROLE_VARIANT[user.role]}>
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
                      <button className="text-[#0A66C2] hover:text-[#004182] text-[12px] font-medium">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>
      </div>

      {!isLoading && filtered.length === 0 && !error && (
        <div className="py-12 text-center text-[14px] text-[#8A8A8A]">
          {search ? "No users match your search." : "No users found."}
        </div>
      )}

      {!isLoading && totalPages > 1 && (
        <div className="px-6 py-4 flex items-center justify-between border-t border-[#D9D8D3]">
          <span className="text-[12px] text-[#8A8A8A]">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-[12px] rounded-[6px] border border-[#D9D8D3] text-[#4A4A4A] hover:bg-[#EAE9E4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-[12px] rounded-[6px] border border-[#D9D8D3] text-[#4A4A4A] hover:bg-[#EAE9E4] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </Card>
  );
}
