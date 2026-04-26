"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { setAuth } from "@/lib/auth";
import type { ApiError } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@democorp.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api/v1"}/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }
      );
      const body = await res.json();
      if (!res.ok) {
        const err = body?.error as ApiError | undefined;
        setError(err?.message ?? "Login failed. Check your credentials.");
        return;
      }
      if (body.user?.role !== "admin") {
        setError("Access denied. Admin role required.");
        return;
      }
      setAuth({ access_token: body.access_token, user: body.user });
      router.replace("/users");
    } catch {
      setError("Could not reach the server. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F3F2EF] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <span className="text-[28px] font-bold text-[#0A66C2]">PulseIQ</span>
          <span className="ml-2 text-[12px] font-semibold uppercase tracking-wider text-white bg-[#CC3333] px-2 py-1 rounded">
            Admin
          </span>
          <p className="mt-3 text-[14px] text-[#6B7280]">Sign in to manage your organization</p>
        </div>

        <div className="bg-white rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[13px] font-semibold text-[#1A1A1A] mb-1.5">
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full h-10 px-3 rounded-[6px] border border-[#D9D8D3] text-[14px] text-[#1A1A1A] bg-white focus:outline-none focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-[#1A1A1A] mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full h-10 px-3 rounded-[6px] border border-[#D9D8D3] text-[14px] text-[#1A1A1A] bg-white focus:outline-none focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20 transition-colors"
              />
            </div>

            {error && (
              <p className="text-[13px] text-[#CC3333] bg-[#CC3333]/8 border border-[#CC3333]/20 rounded-[6px] px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-[#0A66C2] hover:bg-[#004182] disabled:opacity-60 disabled:cursor-not-allowed text-white text-[14px] font-semibold rounded-[6px] transition-colors"
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
