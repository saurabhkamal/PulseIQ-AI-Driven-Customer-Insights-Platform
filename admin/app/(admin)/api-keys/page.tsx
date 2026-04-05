import type { Metadata } from "next";
import { ApiKeysList } from "@/features/api-keys/ApiKeysList";

export const metadata: Metadata = { title: "API Keys — PulseIQ Admin" };

export default function ApiKeysPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold text-[#1A1A1A]">API Keys</h1>
        <p className="text-[14px] text-[#8A8A8A] mt-1">Create and manage API keys for external integrations.</p>
      </div>
      <ApiKeysList />
    </div>
  );
}
