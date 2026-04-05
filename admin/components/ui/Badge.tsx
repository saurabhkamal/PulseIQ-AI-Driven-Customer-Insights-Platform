import { cn } from "@/lib/utils";

type Variant = "brand" | "success" | "warning" | "danger" | "neutral" | "ai";

const VARIANTS: Record<Variant, string> = {
  brand: "bg-[#0A66C2]/10 text-[#0A66C2]",
  success: "bg-[#2D9E6B]/10 text-[#2D9E6B]",
  warning: "bg-[#E8940A]/10 text-[#E8940A]",
  danger: "bg-[#CC3333]/10 text-[#CC3333]",
  neutral: "bg-[#6B7280]/10 text-[#6B7280]",
  ai: "bg-[#7C3AED]/10 text-[#7C3AED]",
};

export function Badge({ children, variant = "neutral", className }: { children: React.ReactNode; variant?: Variant; className?: string }) {
  return (
    <span className={cn("inline-flex items-center rounded px-2 py-0.5 text-[11px] font-medium leading-none", VARIANTS[variant], className)}>
      {children}
    </span>
  );
}
