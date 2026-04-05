import { cn } from "@/lib/utils";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

interface CardHeaderProps {
  title: string;
  action?: React.ReactNode;
  className?: string;
}

export function Card({ children, className, padding = true }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-lg border border-[#D9D8D3]",
        "shadow-[0_1px_3px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]",
        padding && "p-6",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, action, className }: CardHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between mb-4 pb-4 border-b border-[#D9D8D3]",
        className
      )}
    >
      <h3 className="text-[15px] font-semibold text-[#1A1A1A]">{title}</h3>
      {action && <div>{action}</div>}
    </div>
  );
}
