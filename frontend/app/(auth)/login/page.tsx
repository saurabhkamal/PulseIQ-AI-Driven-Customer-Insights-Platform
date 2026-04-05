import { LoginForm } from "@/features/auth/LoginForm";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In — PulseIQ",
};

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-[#F3F2EF] flex items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-bold text-[#0A66C2] tracking-tight">
            PulseIQ
          </h1>
          <p className="text-[14px] text-[#8A8A8A] mt-1">
            Consumer Insights Platform
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg border border-[#D9D8D3] shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-8">
          <h2 className="text-[18px] font-semibold text-[#1A1A1A] mb-6">
            Sign in to your account
          </h2>
          <LoginForm />
        </div>

        <p className="text-center text-[12px] text-[#8A8A8A] mt-6">
          &copy; {new Date().getFullYear()} PulseIQ. All rights reserved.
        </p>
      </div>
    </div>
  );
}
