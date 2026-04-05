"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { authService } from "@/services/auth.service";
import type { ApiError } from "@/types";

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    organizationName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim() || !form.organizationName.trim() || !form.email.trim() || !form.password) {
      setError("All fields are required.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      await authService.register(
        form.name.trim(),
        form.email.trim(),
        form.password,
        form.organizationName.trim()
      );
      router.push("/dashboard");
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message ?? "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
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
        <label htmlFor="name" className="block text-[13px] font-semibold text-[#1A1A1A] mb-1.5">
          Full name
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Alex Johnson"
          className="w-full h-10 px-3 rounded-[6px] border border-[#D9D8D3] text-[14px] text-[#1A1A1A] placeholder:text-[#8A8A8A] bg-white focus:outline-none focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20 transition-colors"
        />
      </div>

      <div>
        <label htmlFor="organizationName" className="block text-[13px] font-semibold text-[#1A1A1A] mb-1.5">
          Organization name
        </label>
        <input
          id="organizationName"
          name="organizationName"
          type="text"
          autoComplete="organization"
          value={form.organizationName}
          onChange={handleChange}
          placeholder="Acme Corp"
          className="w-full h-10 px-3 rounded-[6px] border border-[#D9D8D3] text-[14px] text-[#1A1A1A] placeholder:text-[#8A8A8A] bg-white focus:outline-none focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20 transition-colors"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-[13px] font-semibold text-[#1A1A1A] mb-1.5">
          Work email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={handleChange}
          placeholder="you@company.com"
          className="w-full h-10 px-3 rounded-[6px] border border-[#D9D8D3] text-[14px] text-[#1A1A1A] placeholder:text-[#8A8A8A] bg-white focus:outline-none focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20 transition-colors"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-[13px] font-semibold text-[#1A1A1A] mb-1.5">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={handleChange}
          placeholder="Min. 8 characters"
          className="w-full h-10 px-3 rounded-[6px] border border-[#D9D8D3] text-[14px] text-[#1A1A1A] placeholder:text-[#8A8A8A] bg-white focus:outline-none focus:border-[#0A66C2] focus:ring-2 focus:ring-[#0A66C2]/20 transition-colors"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-[13px] font-semibold text-[#1A1A1A] mb-1.5">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={handleChange}
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
        Create account
      </Button>

      <p className="text-center text-[13px] text-[#8A8A8A] pt-1">
        Already have an account?{" "}
        <Link href="/login" className="text-[#0A66C2] font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
