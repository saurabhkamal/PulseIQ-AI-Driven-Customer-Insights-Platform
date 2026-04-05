import type { UserRole, UserStatus } from "@/types";

export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(dateStr));
}

export function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: "Admin", analyst: "Analyst", marketer: "Marketer", viewer: "Viewer",
};

export const STATUS_STYLES: Record<UserStatus, string> = {
  active: "bg-[#2D9E6B]/10 text-[#2D9E6B]",
  inactive: "bg-[#6B7280]/10 text-[#6B7280]",
  invited: "bg-[#E8940A]/10 text-[#E8940A]",
};
