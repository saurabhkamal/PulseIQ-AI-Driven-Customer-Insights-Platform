"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";
import { authService } from "@/services/auth.service";
import type { User } from "@/types";

function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return typeof payload.exp === "number" && payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const stored = authService.getUser();
    const token  = authService.getToken();

    if (!stored || !token || isTokenExpired(token)) {
      authService.logout();
      router.replace("/login");
      return;
    }
    setUser(stored);
    setChecked(true);
  }, [router]);

  if (!checked) {
    return (
      <div className="min-h-screen bg-[#F3F2EF] flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-[#0A66C2] border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F2EF]">
      <TopNav user={user} />
      <Sidebar userRole={user?.role ?? "viewer"} />
      <main className="pt-14 pl-[240px] min-h-screen" id="main-content">
        <div className="max-w-[1280px] mx-auto p-6">{children}</div>
      </main>
    </div>
  );
}
