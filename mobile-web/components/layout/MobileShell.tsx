import { BottomNav } from "./BottomNav";

interface MobileShellProps {
  children: React.ReactNode;
  title: string;
  headerRight?: React.ReactNode;
}

export function MobileShell({ children, title, headerRight }: MobileShellProps) {
  return (
    <div className="min-h-screen bg-[#F3F2EF] flex flex-col">
      {/* Top bar */}
      <header
        className="sticky top-0 z-30 bg-white border-b border-[#D9D8D3] flex items-center justify-between px-4"
        style={{ height: "52px", paddingTop: "env(safe-area-inset-top)" }}
      >
        <span className="text-[17px] font-bold text-[#0A66C2]">PulseIQ</span>
        <h1 className="absolute left-1/2 -translate-x-1/2 text-[15px] font-semibold text-[#1A1A1A]">
          {title}
        </h1>
        <div className="flex items-center">{headerRight}</div>
      </header>

      {/* Scrollable content */}
      <main
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4"
        style={{ paddingBottom: "calc(var(--bottom-nav-height) + 16px)" }}
      >
        {children}
      </main>

      <BottomNav />
    </div>
  );
}
