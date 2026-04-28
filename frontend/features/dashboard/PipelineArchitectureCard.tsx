"use client";

import { useState } from "react";

const STAGES = [
  {
    step:   1,
    name:   "Sentiment Agent",
    model:  "gpt-4o-mini",
    color:  "#2D9E6B",
    bg:     "rgba(45,158,107,0.07)",
    border: "rgba(45,158,107,0.25)",
    reads:  "Raw feedback & reviews",
    writes: "sentiment_scores",
    what:   "Classifies every piece of customer feedback — positive, neutral, or negative — with a confidence score.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    ),
  },
  {
    step:   2,
    name:   "Behavior Agent",
    model:  "gpt-4o",
    color:  "#3B82F6",
    bg:     "rgba(59,130,246,0.07)",
    border: "rgba(59,130,246,0.25)",
    reads:  "Events + sentiment_scores",
    writes: "behavior_summary",
    what:   "Analyzes funnel drop-offs and cohort retention, weighting patterns by the sentiment context from Step 1.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M2 20h20M6 20V10M12 20V4M18 20v-6" />
      </svg>
    ),
  },
  {
    step:   3,
    name:   "Trend Agent",
    model:  "gpt-4o",
    color:  "#E8940A",
    bg:     "rgba(232,148,10,0.07)",
    border: "rgba(232,148,10,0.25)",
    reads:  "Sales data + behavior_summary + sentiment_scores",
    writes: "trend_predictions",
    what:   "Forecasts emerging product and market trends, combining behavioral signals with sentiment momentum.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
        <polyline points="17 6 23 6 23 12" />
      </svg>
    ),
  },
  {
    step:   4,
    name:   "Recommendation Agent",
    model:  "gpt-4o",
    color:  "#7C3AED",
    bg:     "rgba(124,58,237,0.07)",
    border: "rgba(124,58,237,0.25)",
    reads:  "All three prior outputs",
    writes: "insights (prioritized)",
    what:   "Synthesizes sentiment + behavior + trends to generate ranked, actionable marketing and sales recommendations.",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
] as const;

const CONNECTOR_LABELS = [
  "sentiment_scores",
  "behavior_summary",
  "trend_predictions",
];

export function PipelineArchitectureCard() {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div style={{
      background: "#fff",
      borderRadius: "12px",
      border: "1px solid #D9D8D3",
      overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
    }}>
      {/* Header */}
      <div style={{
        padding: "20px 24px 16px",
        borderBottom: "1px solid #EAE9E4",
        background: "linear-gradient(135deg, #FAFAFA 0%, #F5F3FF 100%)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
              <div style={{
                width: "26px", height: "26px", borderRadius: "6px",
                background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
                </svg>
              </div>
              <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1A1A1A", margin: 0 }}>
                How the AI Pipeline Works
              </h3>
            </div>
            <p style={{ fontSize: "12px", color: "#8A8A8A", margin: 0 }}>
              Sequential execution — each agent enriches the context available to the next
            </p>
          </div>

          {/* Sequential badge */}
          <div style={{
            display: "flex", alignItems: "center", gap: "6px",
            padding: "6px 12px", borderRadius: "99px",
            background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.2)",
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
            <span style={{ fontSize: "11px", fontWeight: 700, color: "#7C3AED", letterSpacing: "0.04em" }}>
              SEQUENTIAL PIPELINE
            </span>
          </div>
        </div>
      </div>

      {/* Flow diagram */}
      <div style={{ padding: "24px" }}>

        {/* Input node */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: "0" }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: "8px",
            padding: "8px 14px", borderRadius: "8px",
            background: "#F3F2EF", border: "1px solid #D9D8D3",
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
            </svg>
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#4A4A4A" }}>Your Data</span>
            <span style={{ fontSize: "11px", color: "#8A8A8A" }}>sales · events · feedback</span>
          </div>
        </div>

        {/* Steps */}
        <div style={{ display: "flex", alignItems: "stretch", gap: "0", marginTop: "0" }}>

          {STAGES.map((stage, i) => {
            const isHov = hovered === i;

            return (
              <div key={stage.step} style={{ display: "flex", alignItems: "stretch", flex: 1 }}>
                {/* Entry connector (from prev step or from "Your Data") */}
                <div style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  paddingTop: "20px",
                  width: i === 0 ? "24px" : "40px",
                  flexShrink: 0,
                }}>
                  {/* Vertical line from above */}
                  <div style={{ width: "2px", height: "16px", background: "#E5E7EB" }} />

                  {i > 0 && (
                    <div style={{
                      fontSize: "9px", fontWeight: 700, letterSpacing: "0.03em",
                      color: STAGES[i - 1].color,
                      background: `${STAGES[i - 1].color}12`,
                      border: `1px solid ${STAGES[i - 1].color}30`,
                      borderRadius: "99px",
                      padding: "2px 6px",
                      whiteSpace: "nowrap",
                      maxWidth: "80px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      textAlign: "center",
                      transform: "rotate(-90deg)",
                      marginBottom: "4px",
                      display: "none",
                    }}>
                      {CONNECTOR_LABELS[i - 1]}
                    </div>
                  )}

                  {/* Arrow head */}
                  <svg width="10" height="8" viewBox="0 0 10 8" style={{ flexShrink: 0 }}>
                    <path d="M5 8L0 0h10z" fill="#D1D5DB" />
                  </svg>
                </div>

                {/* Stage card */}
                <div
                  onMouseEnter={() => setHovered(i)}
                  onMouseLeave={() => setHovered(null)}
                  style={{
                    flex: 1,
                    margin: "8px 0",
                    borderRadius: "10px",
                    border: `1px solid ${isHov ? stage.color + "60" : stage.border}`,
                    background: isHov ? stage.bg : "#FAFAFA",
                    padding: "14px",
                    transition: "all 0.18s ease",
                    boxShadow: isHov ? `0 4px 16px ${stage.color}20` : "none",
                    cursor: "default",
                    position: "relative",
                  }}
                >
                  {/* Step number */}
                  <div style={{
                    position: "absolute", top: "10px", right: "10px",
                    width: "20px", height: "20px", borderRadius: "50%",
                    background: isHov ? stage.color : stage.border,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "background 0.18s",
                  }}>
                    <span style={{ fontSize: "10px", fontWeight: 800, color: "#fff" }}>{stage.step}</span>
                  </div>

                  {/* Icon + name */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <span style={{
                      color: isHov ? stage.color : "#6B7280",
                      display: "flex", transition: "color 0.18s",
                    }}>
                      {stage.icon}
                    </span>
                    <span style={{
                      fontSize: "12px", fontWeight: 700,
                      color: isHov ? "#1A1A1A" : "#4A4A4A",
                      transition: "color 0.18s",
                      paddingRight: "24px",
                    }}>
                      {stage.name}
                    </span>
                  </div>

                  {/* What it does */}
                  <p style={{
                    fontSize: "11px", lineHeight: 1.5,
                    color: isHov ? "#4A4A4A" : "#8A8A8A",
                    margin: "0 0 10px",
                    transition: "color 0.18s",
                  }}>
                    {stage.what}
                  </p>

                  {/* Reads / Writes */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
                      <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9CA3AF", width: "36px", flexShrink: 0 }}>reads</span>
                      <span style={{ fontSize: "10px", color: "#6B7280", fontFamily: "monospace" }}>{stage.reads}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: "5px" }}>
                      <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "#9CA3AF", width: "36px", flexShrink: 0 }}>writes</span>
                      <span style={{
                        fontSize: "10px", fontFamily: "monospace",
                        fontWeight: 700, color: isHov ? stage.color : "#6B7280",
                        transition: "color 0.18s",
                      }}>
                        {stage.writes}
                      </span>
                    </div>
                  </div>

                  {/* Model badge */}
                  <div style={{
                    marginTop: "10px",
                    display: "inline-flex", alignItems: "center", gap: "4px",
                    padding: "2px 8px", borderRadius: "99px",
                    background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.06)",
                  }}>
                    <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                    </svg>
                    <span style={{ fontSize: "10px", fontWeight: 600, color: "#9CA3AF" }}>{stage.model}</span>
                  </div>
                </div>

                {/* Right connector (to next step) */}
                {i < STAGES.length - 1 && (
                  <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", width: "40px", flexShrink: 0, gap: "4px",
                  }}>
                    <div style={{
                      fontSize: "9px", fontWeight: 700, letterSpacing: "0.02em",
                      color: stage.color,
                      background: `${stage.color}10`,
                      border: `1px solid ${stage.color}25`,
                      borderRadius: "4px",
                      padding: "2px 5px",
                      textAlign: "center",
                      lineHeight: 1.3,
                      maxWidth: "38px",
                    }}>
                      {CONNECTOR_LABELS[i].replace("_", "_\n")}
                    </div>
                    <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
                      <path d="M0 5h12M9 1l4 4-4 4" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
            );
          })}

          {/* Output node connector */}
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", width: "24px", flexShrink: 0,
          }}>
            <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
              <path d="M0 5h12M9 1l4 4-4 4" stroke="#D1D5DB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          {/* Output node */}
          <div style={{
            display: "flex", alignItems: "center",
            margin: "8px 0",
            borderRadius: "10px",
            border: "1px solid rgba(124,58,237,0.3)",
            background: "rgba(124,58,237,0.06)",
            padding: "14px 16px",
            flexShrink: 0, alignSelf: "stretch",
            minWidth: "100px",
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#7C3AED", boxShadow: "0 0 6px #7C3AED" }} />
                <span style={{ fontSize: "11px", fontWeight: 700, color: "#7C3AED" }}>OUTPUT</span>
              </div>
              <p style={{ fontSize: "12px", fontWeight: 700, color: "#1A1A1A", margin: "0 0 2px" }}>Insights Dashboard</p>
              <p style={{ fontSize: "10px", color: "#8A8A8A", margin: 0 }}>Prioritized,<br />AI-generated</p>
            </div>
          </div>
        </div>

        {/* Why sequential explanation */}
        <div style={{
          marginTop: "16px",
          padding: "12px 16px",
          borderRadius: "8px",
          background: "rgba(124,58,237,0.04)",
          border: "1px solid rgba(124,58,237,0.12)",
          display: "flex", alignItems: "flex-start", gap: "10px",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: "1px" }}>
            <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
          </svg>
          <p style={{ fontSize: "12px", color: "#4A4A4A", margin: 0, lineHeight: 1.6 }}>
            <strong style={{ color: "#1A1A1A" }}>Why sequential?</strong>{" "}
            The Recommendation Agent in Step 4 can only synthesize all outputs after Steps 1–3 have run.
            Each step enriches the analytical context — sentiment informs behavior analysis, behavior shapes trend forecasting,
            and all three together power the final recommendations.
          </p>
        </div>
      </div>
    </div>
  );
}
