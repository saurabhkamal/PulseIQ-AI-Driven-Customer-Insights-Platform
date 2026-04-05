"use client";

import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function OrgSettings() {
  const [orgName, setOrgName] = useState("Demo Corp");
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Organization Details" />
        <form onSubmit={handleSave} className="space-y-5">
          <div>
            <label htmlFor="org-name" className="block text-[13px] font-semibold text-[#1A1A1A] mb-1.5">
              Organization name
            </label>
            <input
              id="org-name"
              type="text"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              className="w-full h-10 px-3 rounded-[6px] border border-[#D9D8D3] text-[14px] text-[#1A1A1A] bg-white focus:outline-none focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20 transition-colors"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-[#1A1A1A] mb-1.5">
              Plan
              <span className="ml-2 text-[11px] font-normal text-[#8A8A8A]">contact support to change</span>
            </label>
            <input
              type="text"
              value="Professional"
              disabled
              className="w-full h-10 px-3 rounded-[6px] border border-[#D9D8D3] text-[14px] text-[#8A8A8A] bg-[#F3F2EF] cursor-not-allowed"
            />
          </div>
          <div className="flex items-center gap-3">
            <Button type="submit" variant="primary" size="md" isLoading={isSaving}>Save changes</Button>
            {saved && <span className="text-[13px] text-[#2D9E6B] font-medium">✓ Saved</span>}
          </div>
        </form>
      </Card>

      <Card>
        <CardHeader title="Danger Zone" />
        <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-[#CC3333]/30 bg-[#CC3333]/5">
          <div>
            <p className="text-[14px] font-semibold text-[#1A1A1A]">Delete organization</p>
            <p className="text-[12px] text-[#8A8A8A] mt-0.5">
              Permanently delete this organization, all users, data, and insights. This cannot be undone.
            </p>
          </div>
          <Button variant="danger" size="sm">Delete Org</Button>
        </div>
      </Card>
    </div>
  );
}
