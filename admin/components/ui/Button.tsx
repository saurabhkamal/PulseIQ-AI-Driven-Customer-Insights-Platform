import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-[#0A66C2] text-white hover:bg-[#004182] disabled:opacity-50",
  secondary: "bg-white text-[#0A66C2] border border-[#0A66C2] hover:bg-[#0A66C2]/5 disabled:opacity-50",
  ghost: "bg-transparent text-[#4A4A4A] hover:bg-[#EAE9E4] disabled:opacity-50",
  danger: "bg-[#CC3333] text-white hover:bg-[#a82828] disabled:opacity-50",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-[14px]",
  lg: "h-11 px-6 text-[14px]",
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
}

export function Button({ variant = "primary", size = "md", isLoading, disabled, className, children, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || isLoading}
      className={cn("inline-flex items-center justify-center gap-2 rounded-[6px] font-medium transition-colors cursor-pointer", VARIANTS[variant], SIZES[size], className)}
      {...props}
    >
      {isLoading && <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
