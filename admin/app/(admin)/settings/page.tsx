import type { Metadata } from "next";
import { OrgSettings } from "@/features/settings/OrgSettings";

export const metadata: Metadata = { title: "Settings — PulseIQ Admin" };

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-[720px]">
      <div>
        <h1 className="text-[24px] font-semibold text-[#1A1A1A]">Organization Settings</h1>
        <p className="text-[14px] text-[#8A8A8A] mt-1">Manage your organization name, plan, and platform configuration.</p>
      </div>
      <OrgSettings />
    </div>
  );
}
