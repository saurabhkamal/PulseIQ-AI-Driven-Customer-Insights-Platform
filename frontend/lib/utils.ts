import type { SentimentLabel, InsightPriority, TrendDirection, UserRole } from "@/types";

// ─── Number formatting ───────────────────────────────────────────────────────

export function formatCurrency(value: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// ─── Date formatting ─────────────────────────────────────────────────────────

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function formatRelativeTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

// ─── Sentiment helpers ───────────────────────────────────────────────────────

export const SENTIMENT_COLORS: Record<SentimentLabel, string> = {
  positive: "text-[#2D9E6B] bg-[#2D9E6B]/10",
  neutral: "text-[#6B7280] bg-[#6B7280]/10",
  negative: "text-[#CC3333] bg-[#CC3333]/10",
};

export const SENTIMENT_LABELS: Record<SentimentLabel, string> = {
  positive: "Positive",
  neutral: "Neutral",
  negative: "Negative",
};

// ─── Priority helpers ────────────────────────────────────────────────────────

export const PRIORITY_COLORS: Record<InsightPriority, string> = {
  high: "text-[#CC3333] bg-[#CC3333]/10",
  medium: "text-[#E8940A] bg-[#E8940A]/10",
  low: "text-[#6B7280] bg-[#6B7280]/10",
};

// ─── Trend direction ─────────────────────────────────────────────────────────

export const TREND_ICONS: Record<TrendDirection, string> = {
  up: "↑",
  down: "↓",
  flat: "—",
};

export const TREND_COLORS: Record<TrendDirection, string> = {
  up: "text-[#2D9E6B]",
  down: "text-[#CC3333]",
  flat: "text-[#6B7280]",
};

// ─── Role helpers ─────────────────────────────────────────────────────────────

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin",
  analyst: "Analyst",
  marketer: "Marketer",
  viewer: "Viewer",
};

// ─── Classname utility ───────────────────────────────────────────────────────

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}
