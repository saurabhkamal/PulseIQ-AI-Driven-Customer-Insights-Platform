import type { InsightPriority, SentimentLabel, TrendDirection } from "@/types";

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

export function formatNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return String(value);
}

export function formatPercent(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(new Date(dateStr));
}

export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export const PRIORITY_COLORS: Record<InsightPriority, string> = {
  high: "text-[#CC3333] bg-[#CC3333]/10",
  medium: "text-[#E8940A] bg-[#E8940A]/10",
  low: "text-[#6B7280] bg-[#6B7280]/10",
};

export const SENTIMENT_COLORS: Record<SentimentLabel, string> = {
  positive: "text-[#2D9E6B] bg-[#2D9E6B]/10",
  neutral: "text-[#6B7280] bg-[#6B7280]/10",
  negative: "text-[#CC3333] bg-[#CC3333]/10",
};

export const TREND_COLORS: Record<TrendDirection, string> = {
  up: "text-[#2D9E6B]",
  down: "text-[#CC3333]",
  flat: "text-[#6B7280]",
};

export const TREND_ICONS: Record<TrendDirection, string> = {
  up: "↑", down: "↓", flat: "—",
};
