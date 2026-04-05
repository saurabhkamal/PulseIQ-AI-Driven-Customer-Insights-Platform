import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "brand" | "success" | "warning" | "danger" | "neutral" | "ai" | "role";
  className?: string;
}

const VARIANT_CLASSES: Record<NonNullable<BadgeProps["variant"]>, string> = {
  brand: "bg-[#0A66C2]/10 text-[#0A66C2]",
  success: "bg-[#2D9E6B]/10 text-[#2D9E6B]",
  warning: "bg-[#E8940A]/10 text-[#E8940A]",
  danger: "bg-[#CC3333]/10 text-[#CC3333]",
  neutral: "bg-[#6B7280]/10 text-[#6B7280]",
  ai: "bg-[#7C3AED]/10 text-[#7C3AED]",
  role: "bg-[#0A66C2]/10 text-[#0A66C2]",
};

export function Badge({ children, variant = "neutral", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium leading-none",
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
