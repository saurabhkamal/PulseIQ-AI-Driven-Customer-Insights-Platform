import type { Metadata } from "next";
import { AnalystChat } from "@/features/analyst/AnalystChat";

export const metadata: Metadata = {
  title: "AI Analyst — PulseIQ",
};

export default function AnalystPage() {
  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex items-start justify-between shrink-0">
        <div>
          <h1 className="text-[24px] font-semibold text-[#1A1A1A]">AI Analyst</h1>
          <p className="text-[14px] text-[#8A8A8A] mt-1">
            Conversational intelligence over your banking data — powered by GPT-4o and LangGraph.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded-full px-3 py-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED] animate-pulse" aria-hidden="true" />
          <span className="text-[12px] font-medium text-[#7C3AED]">ReAct Agent · 6-layer guardrails</span>
        </div>
      </div>

      {/* Chat takes remaining vertical space */}
      <div className="flex-1 min-h-0" style={{ height: "calc(100vh - 200px)" }}>
        <AnalystChat />
      </div>
    </div>
  );
}
