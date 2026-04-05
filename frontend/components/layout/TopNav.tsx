"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { ROLE_LABELS } from "@/lib/utils";
import { authService } from "@/services/auth.service";
import type { User } from "@/types";

interface TopNavProps {
  user: User | null;
}

export function TopNav({ user }: TopNavProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    authService.logout();
    router.push("/login");
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-14 bg-white border-b border-[#D9D8D3] flex items-center px-6 gap-4">
      {/* Logo */}
      <div className="flex items-center gap-2 min-w-[200px]">
        <span className="text-[18px] font-bold text-[#0A66C2] tracking-tight">
          PulseIQ
        </span>
        <span className="text-[12px] text-[#8A8A8A] font-medium hidden sm:block">
          Consumer Insights
        </span>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button
          className="relative h-8 w-8 flex items-center justify-center rounded hover:bg-[#EAE9E4] transition-colors"
          aria-label="Notifications"
        >
          <svg className="h-5 w-5 text-[#4A4A4A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
          </svg>
        </button>

        {/* User menu */}
        {user && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-[#EAE9E4] transition-colors"
              aria-expanded={open}
              aria-haspopup="true"
            >
              <div className="h-8 w-8 rounded-full bg-[#0A66C2] flex items-center justify-center text-white text-[13px] font-semibold select-none">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col leading-none text-left">
                <span className="text-[13px] font-medium text-[#1A1A1A]">{user.name}</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <Badge variant="role">{ROLE_LABELS[user.role]}</Badge>
                </div>
              </div>
              <svg className="h-4 w-4 text-[#8A8A8A] ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {open && (
              <div className="absolute right-0 top-full mt-1 w-56 bg-white rounded-lg border border-[#D9D8D3] shadow-[0_4px_12px_rgba(0,0,0,0.10)] py-1 z-50">
                {/* User info */}
                <div className="px-4 py-3 border-b border-[#D9D8D3]">
                  <p className="text-[13px] font-semibold text-[#1A1A1A] truncate">{user.name}</p>
                  <p className="text-[12px] text-[#8A8A8A] truncate">{user.email}</p>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <button
                    onClick={() => { setOpen(false); router.push("/settings"); }}
                    className="w-full text-left px-4 py-2 text-[13px] text-[#4A4A4A] hover:bg-[#F3F2EF] transition-colors flex items-center gap-2"
                  >
                    <svg className="h-4 w-4 text-[#8A8A8A]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Profile & Settings
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-[#D9D8D3] py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-[13px] text-[#CC3333] hover:bg-[#CC3333]/5 transition-colors flex items-center gap-2"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
                    </svg>
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
