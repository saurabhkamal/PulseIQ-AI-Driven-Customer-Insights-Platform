import type { Metadata } from "next";
import { ProfileSettings } from "@/features/settings/ProfileSettings";
import { NotificationSettings } from "@/features/settings/NotificationSettings";

export const metadata: Metadata = {
  title: "Settings — PulseIQ",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-[720px]">
      <div>
        <h1 className="text-[24px] font-semibold text-[#1A1A1A]">Settings</h1>
        <p className="text-[14px] text-[#8A8A8A] mt-1">
          Manage your profile and notification preferences.
        </p>
      </div>
      <ProfileSettings />
      <NotificationSettings />
    </div>
  );
}
