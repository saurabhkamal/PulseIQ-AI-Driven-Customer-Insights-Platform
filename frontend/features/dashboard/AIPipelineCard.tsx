"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { insightsService } from "@/services/insights.service";

type StepState = "idle" | "running" | "done";

const STEPS = [
  {
    id: "sentiment",
    step: 1,
    name: "Sentiment Agent",
    model: "gpt-4o-mini",
    description: "Classifies customer feedback into positive, neutral, or negative with confidence scores",
    output: "sentiment_results",
    color: "#2D9E6B",
    glow: "0 0 24px rgba(45,158,107,0.5), 0 0 48px rgba(45,158,107,0.2)",
    border: "rgba(45,158,107,0.6)",
    bg: "rgba(45,158,107,0.08)",
    duration: 4000,
  },
  {
    id: "behavior",
    step: 2,
    name: "Behavior Agent",
    model: "gpt-4o",
    description: "Analyzes funnel data, cohort patterns, and identifies conversion bottlenecks",
    output: "behavior_summary",
    color: "#3B82F6",
    glow: "0 0 24px rgba(59,130,246,0.5), 0 0 48px rgba(59,130,246,0.2)",
    border: "rgba(59,130,246,0.6)",
    bg: "rgba(59,130,246,0.08)",
    duration: 7000,
  },
  {
    id: "trends",
    step: 3,
    name: "Trend Agent",
    model: "gpt-4o",
    description: "Forecasts emerging product and market trends from sales and event signals",
    output: "trend_predictions",
    color: "#F59E0B",
    glow: "0 0 24px rgba(245,158,11,0.5), 0 0 48px rgba(245,158,11,0.2)",
    border: "rgba(245,158,11,0.6)",
    bg: "rgba(245,158,11,0.08)",
    duration: 5000,
  },
  {
    id: "recommendations",
    step: 4,
    name: "Recommendation Agent",
    model: "gpt-4o",
    description: "Synthesizes all outputs into prioritized marketing and sales recommendations",
    output: "insights",
    color: "#A78BFA",
    glow: "0 0 24px rgba(167,139,250,0.5), 0 0 48px rgba(167,139,250,0.2)",
    border: "rgba(167,139,250,0.6)",
    bg: "rgba(167,139,250,0.08)",
    duration: 6000,
  },
] as const;

const TOTAL_DURATION = STEPS.reduce((s, t) => s + t.duration, 0);

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}

export function AIPipelineCard() {
  const [stepStates, setStepStates] = useState<StepState[]>(["idle", "idle", "idle", "idle"]);
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [completedAt, setCompletedAt] = useState<string | null>(null);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const elapsed = useRef(0);
  const startTime = useRef(0);

  // Smooth progress animation
  useEffect(() => {
    if (isRunning) {
      startTime.current = Date.now() - elapsed.current;
      progressRef.current = setInterval(() => {
        const spent = Date.now() - startTime.current;
        const pct = Math.min(99, (spent / TOTAL_DURATION) * 100);
        setProgress(pct);
        elapsed.current = spent;
      }, 50);
    } else {
      if (progressRef.current) clearInterval(progressRef.current);
      if (isDone) setProgress(100);
    }
    return () => { if (progressRef.current) clearInterval(progressRef.current); };
  }, [isRunning, isDone]);

  const runPipeline = useCallback(async () => {
    setIsRunning(true);
    setIsDone(false);
    setError(null);
    setProgress(0);
    elapsed.current = 0;
    setCompletedAt(null);
    setStepStates(["idle", "idle", "idle", "idle"]);

    try {
      await insightsService.refreshInsights();
    } catch {
      setError("Could not reach the backend. Make sure the server is running.");
      setIsRunning(false);
      return;
    }

    for (let i = 0; i < STEPS.length; i++) {
      setStepStates((prev) => prev.map((s, idx) => (idx === i ? "running" : s)));
      await delay(STEPS[i].duration);
      setStepStates((prev) => prev.map((s, idx) => (idx === i ? "done" : s)));
    }

    setIsDone(true);
    setIsRunning(false);
    setCompletedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
  }, []);

  const reset = () => {
    setStepStates(["idle", "idle", "idle", "idle"]);
    setIsDone(false);
    setError(null);
    setProgress(0);
    elapsed.current = 0;
    setCompletedAt(null);
  };

  const activeStep = stepStates.findIndex((s) => s === "running");
  const doneCount = stepStates.filter((s) => s === "done").length;

  return (
    <>
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes beam {
          0% { transform: translateX(-100%); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateX(300%); opacity: 0; }
        }
        @keyframes grid-fade {
          0%, 100% { opacity: 0.03; }
          50% { opacity: 0.07; }
        }
        @keyframes count-up {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer-text {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(18px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(18px) rotate(-360deg); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
      `}</style>

      <div
        style={{
          background: "linear-gradient(135deg, #0D0B1A 0%, #0E1525 40%, #0C1520 100%)",
          borderRadius: "12px",
          overflow: "hidden",
          boxShadow: "0 4px 32px rgba(0,0,0,0.3), 0 1px 0 rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Animated grid background */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(rgba(124,58,237,0.05) 1px, transparent 1px),
              linear-gradient(90deg, rgba(124,58,237,0.05) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px",
            animation: "grid-fade 4s ease-in-out infinite",
            pointerEvents: "none",
          }}
        />

        {/* Top glow orb */}
        <div style={{
          position: "absolute",
          top: "-60px",
          left: "50%",
          transform: "translateX(-50%)",
          width: "300px",
          height: "120px",
          background: "radial-gradient(ellipse, rgba(124,58,237,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "relative" }}>

          {/* ── HEADER ── */}
          <div style={{ padding: "28px 28px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                  {/* Orchestrator icon */}
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "8px",
                    background: "linear-gradient(135deg, #7C3AED, #4F46E5)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: "0 0 16px rgba(124,58,237,0.4)",
                    flexShrink: 0,
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12" />
                    </svg>
                  </div>
                  <div>
                    <h2 style={{
                      fontSize: "18px", fontWeight: 700, margin: 0,
                      background: "linear-gradient(90deg, #fff 0%, #C4B5FD 50%, #fff 100%)",
                      backgroundSize: "200% auto",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      animation: "shimmer-text 3s linear infinite",
                    }}>
                      AI Agent Pipeline
                    </h2>
                    <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", margin: 0 }}>
                      Powered by Orchestrator · GPT-4o
                    </p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div style={{ display: "flex", gap: "20px" }}>
                {[
                  { label: "Agents", value: "4" },
                  { label: "Models", value: "2" },
                  { label: "Outputs", value: "3" },
                ].map((stat) => (
                  <div key={stat.label} style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "20px", fontWeight: 700, color: "#fff", lineHeight: 1 }}>{stat.value}</div>
                    <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginTop: "2px" }}>{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginTop: "20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.4)" }}>
                  {isRunning
                    ? `Step ${activeStep + 1} of 4 — ${STEPS[activeStep]?.name ?? ""}`
                    : isDone
                    ? "Pipeline complete"
                    : "Ready to run"}
                </span>
                <span style={{
                  fontSize: "11px", fontWeight: 600,
                  color: isDone ? "#2D9E6B" : isRunning ? "#A78BFA" : "rgba(255,255,255,0.3)",
                }}>
                  {Math.round(progress)}%
                </span>
              </div>
              <div style={{
                height: "4px", borderRadius: "99px",
                background: "rgba(255,255,255,0.08)",
                overflow: "hidden", position: "relative",
              }}>
                <div style={{
                  height: "100%", borderRadius: "99px",
                  width: `${progress}%`,
                  transition: isDone ? "width 0.3s ease" : "none",
                  background: isDone
                    ? "linear-gradient(90deg, #2D9E6B, #34D399)"
                    : "linear-gradient(90deg, #7C3AED, #3B82F6, #F59E0B, #A78BFA)",
                  backgroundSize: "200% auto",
                  animation: isRunning ? "shimmer-text 2s linear infinite" : "none",
                  boxShadow: isRunning ? "0 0 8px rgba(124,58,237,0.6)" : "none",
                }} />
              </div>
            </div>
          </div>

          {/* ── AGENT STEPS ── */}
          <div style={{ padding: "24px 28px", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0", position: "relative" }}>

            {STEPS.map((step, i) => {
              const state = stepStates[i];
              const isActive = state === "running";
              const isDoneStep = state === "done";

              return (
                <div key={step.id} style={{ display: "flex", alignItems: "stretch" }}>
                  {/* Agent card */}
                  <div
                    style={{
                      flex: 1,
                      borderRadius: "10px",
                      border: `1px solid ${isActive ? step.border : isDoneStep ? "rgba(45,158,107,0.3)" : "rgba(255,255,255,0.07)"}`,
                      background: isActive ? step.bg : isDoneStep ? "rgba(45,158,107,0.05)" : "rgba(255,255,255,0.03)",
                      padding: "18px 16px",
                      transition: "all 0.4s ease",
                      boxShadow: isActive ? step.glow : "none",
                      position: "relative",
                      overflow: "hidden",
                      animation: isActive ? "float 2s ease-in-out infinite" : "none",
                    }}
                  >
                    {/* Step number watermark */}
                    <div style={{
                      position: "absolute", top: "8px", right: "10px",
                      fontSize: "48px", fontWeight: 900, lineHeight: 1,
                      color: isActive ? step.color : "rgba(255,255,255,0.04)",
                      transition: "color 0.4s",
                      userSelect: "none",
                    }}>
                      {step.step}
                    </div>

                    {/* Beam sweep on active */}
                    {isActive && (
                      <div style={{
                        position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                        background: `linear-gradient(90deg, transparent, ${step.color}18, transparent)`,
                        animation: "beam 2s ease-in-out infinite",
                        pointerEvents: "none",
                      }} />
                    )}

                    {/* Status indicator */}
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px", position: "relative" }}>
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        {isDoneStep ? (
                          <div style={{
                            width: "20px", height: "20px", borderRadius: "50%",
                            background: "#2D9E6B",
                            display: "flex", alignItems: "center", justifyContent: "center",
                          }}>
                            <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                        ) : isActive ? (
                          <>
                            <div style={{
                              width: "20px", height: "20px", borderRadius: "50%",
                              background: step.color,
                              display: "flex", alignItems: "center", justifyContent: "center",
                            }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none">
                                <circle cx="12" cy="12" r="10" stroke="white" strokeWidth="3" strokeOpacity="0.3" />
                                <path d="M12 2a10 10 0 010 20" stroke="white" strokeWidth="3" strokeLinecap="round"
                                  style={{ animation: "shimmer-text 0.8s linear infinite" }} />
                              </svg>
                            </div>
                            {/* Pulse ring */}
                            <div style={{
                              position: "absolute", inset: 0,
                              borderRadius: "50%",
                              border: `2px solid ${step.color}`,
                              animation: "pulse-ring 1.2s ease-out infinite",
                            }} />
                          </>
                        ) : (
                          <div style={{
                            width: "20px", height: "20px", borderRadius: "50%",
                            border: "1px solid rgba(255,255,255,0.15)",
                            background: "rgba(255,255,255,0.03)",
                          }} />
                        )}
                      </div>
                      <span style={{
                        fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em",
                        color: isActive ? step.color : isDoneStep ? "#2D9E6B" : "rgba(255,255,255,0.25)",
                        textTransform: "uppercase",
                      }}>
                        {isDoneStep ? "Complete" : isActive ? "Running" : `Step ${step.step}`}
                      </span>
                    </div>

                    {/* Agent name */}
                    <p style={{
                      fontSize: "14px", fontWeight: 700, margin: "0 0 6px",
                      color: isActive ? "#fff" : isDoneStep ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.45)",
                      transition: "color 0.4s",
                      lineHeight: 1.3, position: "relative",
                    }}>
                      {step.name}
                    </p>

                    {/* Description */}
                    <p style={{
                      fontSize: "11px", lineHeight: 1.5, margin: "0 0 14px",
                      color: isActive ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.25)",
                      transition: "color 0.4s", position: "relative",
                    }}>
                      {step.description}
                    </p>

                    {/* Footer: model + output */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", position: "relative" }}>
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: "4px",
                        alignSelf: "flex-start",
                        padding: "2px 8px", borderRadius: "99px",
                        background: "rgba(255,255,255,0.07)",
                        border: "1px solid rgba(255,255,255,0.08)",
                      }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2">
                          <circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                        </svg>
                        <span style={{ fontSize: "10px", fontWeight: 600, color: "rgba(255,255,255,0.5)" }}>
                          {step.model}
                        </span>
                      </div>
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: "4px",
                        alignSelf: "flex-start",
                      }}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill={isActive ? step.color : "rgba(255,255,255,0.2)"}>
                          <circle cx="12" cy="12" r="8" />
                        </svg>
                        <span style={{ fontSize: "10px", color: isActive ? step.color : "rgba(255,255,255,0.2)", fontWeight: 600 }}>
                          {step.output}
                        </span>
                      </div>
                    </div>

                    {/* Active bottom bar */}
                    {isActive && (
                      <div style={{
                        position: "absolute", bottom: 0, left: 0, right: 0, height: "2px",
                        background: `linear-gradient(90deg, transparent, ${step.color}, transparent)`,
                        animation: "beam 1.5s ease-in-out infinite",
                      }} />
                    )}
                  </div>

                  {/* Connector arrow */}
                  {i < STEPS.length - 1 && (
                    <div style={{
                      width: "28px", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                        {/* Flowing dots */}
                        {[0, 1, 2].map((dot) => (
                          <div key={dot} style={{
                            width: "4px", height: "4px", borderRadius: "50%",
                            background: stepStates[i] === "done"
                              ? STEPS[i + 1].color
                              : "rgba(255,255,255,0.12)",
                            transition: "background 0.6s ease",
                            transitionDelay: `${dot * 0.1}s`,
                          }} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── FOOTER ── */}
          <div style={{
            padding: "20px 28px 24px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: "16px", flexWrap: "wrap",
          }}>
            <div>
              {error && (
                <p style={{ fontSize: "13px", color: "#F87171", margin: 0 }}>{error}</p>
              )}
              {isDone && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", animation: "count-up 0.4s ease" }}>
                  <div style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    background: "#2D9E6B",
                    boxShadow: "0 0 8px #2D9E6B",
                  }} />
                  <p style={{ fontSize: "13px", color: "#34D399", margin: 0, fontWeight: 600 }}>
                    All agents complete — insights, trends &amp; sentiment updated
                  </p>
                  <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{completedAt}</span>
                </div>
              )}
              {!error && !isDone && (
                <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", margin: 0 }}>
                  {isRunning
                    ? `${doneCount} of 4 agents complete · ~${Math.round((TOTAL_DURATION / 1000) * (1 - progress / 100))}s remaining`
                    : "Run a full AI analysis across all 4 agents to refresh your insights"}
                </p>
              )}
            </div>

            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {(isDone || error) && (
                <button
                  onClick={reset}
                  style={{
                    height: "38px", padding: "0 16px", borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.12)",
                    background: "rgba(255,255,255,0.05)",
                    color: "rgba(255,255,255,0.5)", fontSize: "13px", fontWeight: 500,
                    cursor: "pointer", transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.8)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
                >
                  Reset
                </button>
              )}
              <button
                onClick={runPipeline}
                disabled={isRunning}
                style={{
                  height: "38px", padding: "0 20px", borderRadius: "8px",
                  border: "none",
                  background: isRunning
                    ? "rgba(124,58,237,0.3)"
                    : "linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)",
                  color: "white", fontSize: "13px", fontWeight: 700,
                  cursor: isRunning ? "not-allowed" : "pointer",
                  opacity: isRunning ? 0.8 : 1,
                  display: "flex", alignItems: "center", gap: "8px",
                  boxShadow: isRunning ? "none" : "0 0 20px rgba(124,58,237,0.4), 0 4px 12px rgba(0,0,0,0.3)",
                  transition: "all 0.2s",
                  letterSpacing: "0.01em",
                }}
                onMouseEnter={(e) => {
                  if (!isRunning) {
                    e.currentTarget.style.boxShadow = "0 0 32px rgba(124,58,237,0.6), 0 4px 16px rgba(0,0,0,0.4)";
                    e.currentTarget.style.transform = "translateY(-1px)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = isRunning ? "none" : "0 0 20px rgba(124,58,237,0.4), 0 4px 12px rgba(0,0,0,0.3)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {isRunning ? (
                  <>
                    <svg style={{ animation: "shimmer-text 0.8s linear infinite" }} width="14" height="14" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.3)" strokeWidth="3" />
                      <path d="M12 2a10 10 0 010 20" stroke="white" strokeWidth="3" strokeLinecap="round" />
                    </svg>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                      <path d="M13 10V3L4 14h7v7l9-11h-7z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {isDone ? "Run Again" : "Run Analysis"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
