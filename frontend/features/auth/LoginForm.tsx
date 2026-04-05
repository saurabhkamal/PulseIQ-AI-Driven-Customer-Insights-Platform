"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { authService } from "@/services/auth.service";
import type { ApiError } from "@/types";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }

    setIsLoading(true);
    try {
      await authService.login(email.trim(), password);
      router.push("/dashboard");
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message ?? "Sign in failed. Please check your credentials.");
    } finally {
      setIsLoading(false);
    }
  }

  function handleSsoLogin(provider: "google" | "microsoft") {
    // TODO: wire to authService.ssoRedirect(provider)
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/${provider}`;
  }

  return (
    <div className="space-y-5">
      {/* SSO buttons */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => handleSsoLogin("google")}
          className="w-full h-10 flex items-center justify-center gap-3 rounded-[6px] border border-[#D9D8D3] bg-white text-[14px] font-medium text-[#1A1A1A] hover:bg-[#F3F2EF] transition-colors"
        >
          <GoogleIcon />
          Continue with Google
        </button>
        <button
          type="button"
          onClick={() => handleSsoLogin("microsoft")}
          className="w-full h-10 flex items-center justify-center gap-3 rounded-[6px] border border-[#D9D8D3] bg-white text-[14px] font-medium text-[#1A1A1A] hover:bg-[#F3F2EF] transition-colors"
        >
          <MicrosoftIcon />
          Continue with Microsoft
        </button>
      </div>

      {/* Divider */}
      <div className="relative flex items-center gap-3">
        <div className="flex-1 h-px bg-[#D9D8D3]" />
        <span className="text-[12px] text-[#8A8A8A]">or</span>
        <div className="flex-1 h-px bg-[#D9D8D3]" />
      </div>

      {/* Email/password form */}
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {error && (
          <div
            role="alert"
            className="rounded-[6px] bg-[#CC3333]/10 border border-[#CC3333]/30 px-4 py-3 text-[13px] text-[#CC3333]"
          >
            {error}
          </div>
        )}

        <div>
          <label
            htmlFor="email"
            className="block text-[13px] font-semibold text-[#1A1A1A] mb-1.5"
          >
            Email address
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
            className="w-full h-10 px-3 rounded-[6px] border border-[#D9D8D3] text-[14px] text-[#1A1A1A] placeholder:text-[#8A8A8A] bg-white focus:outline-none focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20 transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-[13px] font-semibold text-[#1A1A1A] mb-1.5"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full h-10 px-3 rounded-[6px] border border-[#D9D8D3] text-[14px] text-[#1A1A1A] placeholder:text-[#8A8A8A] bg-white focus:outline-none focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20 transition-colors"
          />
        </div>

        <Button
          type="submit"
          variant="primary"
          size="md"
          isLoading={isLoading}
          className="w-full"
        >
          Sign in
        </Button>
      </form>

      <p className="text-center text-[13px] text-[#8A8A8A] pt-2">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-[#0A66C2] font-medium hover:underline">
          Get started free
        </Link>
      </p>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function MicrosoftIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M11.4 2H2v9.4h9.4V2z" fill="#F25022" />
      <path d="M22 2h-9.4v9.4H22V2z" fill="#7FBA00" />
      <path d="M11.4 12.6H2V22h9.4v-9.4z" fill="#00A4EF" />
      <path d="M22 12.6h-9.4V22H22v-9.4z" fill="#FFB900" />
    </svg>
  );
}
