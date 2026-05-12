"use client";

import Link from "next/link";

const AGENT_NODES = [
  { step: 1, label: "Behavior",    color: "#7C3AED" },
  { step: 2, label: "Churn",       color: "#CC3333" },
  { step: 3, label: "Engagement",  color: "#E8940A" },
  { step: 4, label: "Abandonment", color: "#0A66C2" },
  { step: 5, label: "Trend",       color: "#2D9E6B" },
  { step: 6, label: "Affinity",    color: "#7C3AED" },
  { step: 7, label: "Cross-Sell",  color: "#0A66C2" },
  { step: 8, label: "Recommend",   color: "#2D9E6B" },
  { step: 9, label: "Compliance",  color: "#6B7280" },
];

export function PipelineOverviewCard() {
  return (
    <div className="bg-white border border-[#D9D8D3] rounded-xl p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[15px] font-semibold text-[#1A1A1A]">AI Pipeline</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20">
              9 agents
            </span>
          </div>
          <p className="text-xs text-[#8A8A8A] mt-0.5">
            Orchestrated multi-agent pipeline · GPT-4o
          </p>
        </div>
        <Link
          href="/pipeline"
          className="text-xs font-medium text-[#0A66C2] hover:text-[#004182] flex items-center gap-1 transition-colors flex-shrink-0"
        >
          View full pipeline
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </Link>
      </div>

      {/* Agent flow — 3×3 grid of numbered nodes with step labels */}
      <div className="space-y-2">
        {[AGENT_NODES.slice(0, 3), AGENT_NODES.slice(3, 6), AGENT_NODES.slice(6, 9)].map(
          (row, rowIdx) => (
            <div key={rowIdx} className="flex items-center gap-1">
              {row.map((node, nodeIdx) => (
                <div key={node.step} className="flex items-center gap-1 flex-1 min-w-0">
                  {/* Node */}
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ backgroundColor: node.color }}
                      title={node.label}
                    >
                      {node.step}
                    </div>
                    <span className="text-[9px] text-[#8A8A8A] text-center leading-tight font-medium truncate w-full">
                      {node.label}
                    </span>
                  </div>
                  {/* Arrow (not after last in row) */}
                  {nodeIdx < row.length - 1 && (
                    <svg width="14" height="8" viewBox="0 0 14 8" className="flex-shrink-0 -mt-4" aria-hidden="true">
                      <path d="M0 4H11M11 4L7 1M11 4L7 7" stroke="#D9D8D3" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Footer stats */}
      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#EAE9E4]">
        {[
          { label: "Tables written", value: "3", color: "#2D9E6B" },
          { label: "GPT-4o calls", value: "8–9 / run", color: "#0A66C2" },
          { label: "Compliance", value: "Weekly", color: "#6B7280" },
        ].map((s) => (
          <div key={s.label} className="flex-1 text-center">
            <div className="text-sm font-semibold tabular-nums" style={{ color: s.color }}>
              {s.value}
            </div>
            <div className="text-[10px] text-[#8A8A8A] mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
