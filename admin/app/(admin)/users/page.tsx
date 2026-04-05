import type { Metadata } from "next";
import { UsersTable } from "@/features/users/UsersTable";

export const metadata: Metadata = { title: "Users — PulseIQ Admin" };

export default function UsersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[24px] font-semibold text-[#1A1A1A]">Users</h1>
          <p className="text-[14px] text-[#8A8A8A] mt-1">Manage organization members, roles, and invitations.</p>
        </div>
      </div>
      <UsersTable />
    </div>
  );
}
