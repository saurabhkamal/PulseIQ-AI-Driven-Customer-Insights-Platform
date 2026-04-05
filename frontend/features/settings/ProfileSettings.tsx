"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ROLE_LABELS } from "@/lib/utils";
import type { UserRole } from "@/types";

// Placeholder — will be replaced with real session data once auth is live
const DEMO_USER = {
  name: "Alex Johnson",
  email: "analyst@demo.com",
  role: "analyst" as UserRole,
  organizationName: "Demo Corp",
};

export function ProfileSettings() {
  const [name, setName] = useState(DEMO_USER.name);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setSaved(false);
    // TODO: wire to authService.updateProfile()
    await new Promise((r) => setTimeout(r, 600));
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <Card>
      <CardHeader title="Profile" />
      <form onSubmit={handleSave} className="space-y-5">
        {/* Avatar row */}
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-[#0A66C2] flex items-center justify-center text-white text-[22px] font-bold select-none shrink-0">
            {DEMO_USER.name.charAt(0)}
          </div>
          <div>
            <p className="text-[14px] font-semibold text-[#1A1A1A]">{DEMO_USER.name}</p>
            <p className="text-[13px] text-[#8A8A8A]">{DEMO_USER.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="role">{ROLE_LABELS[DEMO_USER.role]}</Badge>
              <span className="text-[12px] text-[#8A8A8A]">{DEMO_USER.organizationName}</span>
            </div>
          </div>
        </div>

        <div className="h-px bg-[#D9D8D3]" />

        {/* Name */}
        <div>
          <label htmlFor="display-name" className="block text-[13px] font-semibold text-[#1A1A1A] mb-1.5">
            Display name
          </label>
          <input
            id="display-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full h-10 px-3 rounded-[6px] border border-[#D9D8D3] text-[14px] text-[#1A1A1A] bg-white focus:outline-none focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20 transition-colors"
          />
        </div>

        {/* Email (read-only) */}
        <div>
          <label className="block text-[13px] font-semibold text-[#1A1A1A] mb-1.5">
            Email address
            <span className="ml-2 text-[11px] font-normal text-[#8A8A8A]">managed by your SSO provider</span>
          </label>
          <input
            type="email"
            value={DEMO_USER.email}
            disabled
            className="w-full h-10 px-3 rounded-[6px] border border-[#D9D8D3] text-[14px] text-[#8A8A8A] bg-[#F3F2EF] cursor-not-allowed"
          />
        </div>

        {/* Role (read-only) */}
        <div>
          <label className="block text-[13px] font-semibold text-[#1A1A1A] mb-1.5">
            Role
            <span className="ml-2 text-[11px] font-normal text-[#8A8A8A]">assigned by your administrator</span>
          </label>
          <input
            type="text"
            value={ROLE_LABELS[DEMO_USER.role]}
            disabled
            className="w-full h-10 px-3 rounded-[6px] border border-[#D9D8D3] text-[14px] text-[#8A8A8A] bg-[#F3F2EF] cursor-not-allowed"
          />
        </div>

        <div className="flex items-center gap-3">
          <Button type="submit" variant="primary" size="md" isLoading={isSaving}>
            Save changes
          </Button>
          {saved && (
            <span className="text-[13px] text-[#2D9E6B] font-medium">✓ Saved</span>
          )}
        </div>
      </form>
    </Card>
  );
}
