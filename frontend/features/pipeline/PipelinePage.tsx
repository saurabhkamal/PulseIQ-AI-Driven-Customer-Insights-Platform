"use client";

import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────── */
type StepStatus = "idle" | "active" | "completed";

interface AgentStep {
  step: number;
  id: string;
  name: string;
  label: string;
  tagline: string;
  color: string;
  lightBg: string;
  description: string;
  inputs: string[];
  outputs: string[];
  dataPassedDown: string | null;
  feedsInto: number[];
  weeklyOnly?: boolean;
}

/* ─── Static data ───────────────────────────────────── */
const TRIGGERS = [
  {
    label: "Data Ingested",
    description: "New sales, events, or feedback arrives via REST API or CSV upload",
    color: "#0A66C2",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
      </svg>
    ),
  },
  {
    label: "Daily Schedule",
    description: "Automated pipeline triggered every day at 00:00 UTC via cron job",
    color: "#2D9E6B",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    label: "User Refresh",
    description: "Analyst or Admin clicks 'Refresh Insights' — POST /api/v1/insights/refresh",
    color: "#7C3AED",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
      </svg>
    ),
  },
];

const STEPS: AgentStep[] = [
  {
    step: 1,
    id: "behavior",
    name: "BehaviorAnalysisAgent",
    label: "Behavior Analysis",
    tagline: "Foundation layer — outputs consumed by 5 downstream agents",
    color: "#7C3AED",
    lightBg: "rgba(124,58,237,0.06)",
    description:
      "Processes 30 days of consumer event streams to extract funnel drop-off rates, cohort retention matrices, and top-performing products. The first agent to run — its outputs are passed to Churn, Abandonment, Trend, Affinity, and Recommendations.",
    inputs: ["Consumer events (30d)", "Sales transactions", "Product catalog"],
    outputs: ["Funnel metrics", "Cohort summary", "Top products list", "Segment breakdown"],
    dataPassedDown: "funnel_data · top_products · cohort_data",
    feedsInto: [2, 4, 5, 6, 8],
  },
  {
    step: 2,
    id: "churn",
    name: "ChurnPredictionAgent",
    label: "Churn Prediction",
    tagline: "Risk detection — identifies customers about to leave",
    color: "#CC3333",
    lightBg: "rgba(204,51,51,0.06)",
    description:
      "Analyses cohort activity from Step 1, event frequency patterns, and 30-day sentiment trends to identify high-risk segments. Its churn signals and event patterns flow into Trend Prediction and Cross-Sell Intelligence.",
    inputs: ["cohort_data ← Step 1", "Sentiment trend (30d)", "Event patterns"],
    outputs: ["At-risk segment description", "Churn signals", "Retention actions", "Risk %"],
    dataPassedDown: "churn_signals · event_patterns",
    feedsInto: [5, 7],
  },
  {
    step: 3,
    id: "engagement",
    name: "EngagementScoringAgent",
    label: "Engagement Scoring",
    tagline: "Measures depth of customer interaction across channels",
    color: "#E8940A",
    lightBg: "rgba(232,148,10,0.06)",
    description:
      "Scores customer engagement by segment, channel distribution, and product interaction depth. The per-segment engagement scores are forwarded directly to the Cross-Sell Intelligence agent.",
    inputs: ["Event frequency by segment", "Channel distribution", "Product interaction depth"],
    outputs: ["Overall engagement score", "Per-segment scores", "Channel breakdown"],
    dataPassedDown: "engagement_scores · segment_scores",
    feedsInto: [7],
  },
  {
    step: 4,
    id: "abandonment",
    name: "JourneyAbandonmentAgent",
    label: "Journey Abandonment",
    tagline: "Detects KYC and onboarding drop-off points",
    color: "#0A66C2",
    lightBg: "rgba(10,102,194,0.06)",
    description:
      "Uses funnel stage data from Step 1 to detect critical KYC and onboarding drop-off points. Generates targeted interventions to improve activation rates. Outputs are persisted as insights — no further downstream dependency.",
    inputs: ["funnel_steps ← Step 1", "Journey type (KYC)", "Event properties"],
    outputs: ["Drop-off rates per stage", "Abandonment insights", "Recovery recommendations"],
    dataPassedDown: null,
    feedsInto: [],
  },
  {
    step: 5,
    id: "trend",
    name: "TrendPredictionAgent",
    label: "Trend Prediction",
    tagline: "Forecasts emerging product and market signals",
    color: "#2D9E6B",
    lightBg: "rgba(45,158,107,0.06)",
    description:
      "Synthesises top products (Step 1) and churn event signals (Step 2) to forecast 5 emerging market trends via GPT-4o. Outputs are persisted to the trend_predictions table and forwarded to the Recommendation agent.",
    inputs: ["top_products ← Step 1", "churn_signals ← Step 2", "Category data"],
    outputs: ["5 trend forecasts", "Signal strength ratings", "Horizon days", "Confidence scores"],
    dataPassedDown: "trend_outputs[]",
    feedsInto: [8],
  },
  {
    step: 6,
    id: "affinity",
    name: "ProductAffinityAgent",
    label: "Product Affinity",
    tagline: "Maps which products each segment is most likely to adopt",
    color: "#7C3AED",
    lightBg: "rgba(124,58,237,0.06)",
    description:
      "Combines product catalog, customer segment profiles (both from Step 1), and event patterns (Step 2) to produce a propensity score matrix. Outputs are persisted as insights. No further downstream agents receive its output.",
    inputs: ["products_catalog ← Step 1", "customer_segments ← Step 1", "event_patterns ← Step 2"],
    outputs: ["Affinity matrix", "Propensity scores", "Segment-product mapping"],
    dataPassedDown: null,
    feedsInto: [],
  },
  {
    step: 7,
    id: "crosssell",
    name: "CrossSellIntelligenceAgent",
    label: "Cross-Sell Intelligence",
    tagline: "Surfaces the highest-value product expansion opportunities",
    color: "#0A66C2",
    lightBg: "rgba(10,102,194,0.06)",
    description:
      "Combines churn event patterns (Step 2), engagement scores (Step 3), and available products to identify high-value cross-sell opportunities with recommended messaging angles. Top 3 opportunities are persisted as insights.",
    inputs: ["churn_signals ← Step 2", "engagement_scores ← Step 3", "Available products"],
    outputs: ["Cross-sell opportunities", "Propensity scores", "Message angles", "Priority tiers"],
    dataPassedDown: null,
    feedsInto: [],
  },
  {
    step: 8,
    id: "recommendation",
    name: "RecommendationAgent",
    label: "Recommendations",
    tagline: "Final synthesis — produces prioritised marketing actions",
    color: "#2D9E6B",
    lightBg: "rgba(45,158,107,0.06)",
    description:
      "The capstone agent. Synthesises the behavior summary (Step 1), 5 trend forecasts (Step 5), and live sentiment percentages to generate prioritised, actionable marketing and sales recommendations. All outputs are persisted to Supabase.",
    inputs: ["behavior_summary ← Step 1", "trend_outputs[] ← Step 5", "Sentiment breakdown (live)"],
    outputs: ["Prioritised insights", "Marketing actions", "Sales recommendations"],
    dataPassedDown: null,
    feedsInto: [],
  },
  {
    step: 9,
    id: "compliance",
    name: "ComplianceSignalAgent",
    label: "Compliance Signals",
    tagline: "Weekly FCA Consumer Duty and TCF signal detection",
    color: "#6B7280",
    lightBg: "rgba(107,114,128,0.06)",
    description:
      "Analyses sentiment trends, complaint volumes, and vulnerable customer event signals to detect FCA Consumer Duty and TCF compliance issues. Runs on the weekly schedule only — controlled by the run_compliance flag in the orchestrator.",
    inputs: ["Sentiment summary (weekly)", "Complaint volume trend", "Vulnerable event signals"],
    outputs: ["Signal type", "Severity (high/medium/low)", "Regulatory reference", "Review action"],
    dataPassedDown: null,
    feedsInto: [],
    weeklyOnly: true,
  },
];

const PERSISTED = [
  {
    table: "insights",
    description: "Marketing recommendations, churn alerts, and cross-sell opportunities",
    agents: ["RecommendationAgent", "ChurnPredictionAgent", "CrossSellIntelligenceAgent"],
    color: "#2D9E6B",
    count: "4–8 per run",
  },
  {
    table: "trend_predictions",
    description: "Forecasted product and market trends with confidence scores",
    agents: ["TrendPredictionAgent"],
    color: "#7C3AED",
    count: "5 per run",
  },
  {
    table: "compliance_signals",
    description: "FCA Consumer Duty and TCF compliance flags",
    agents: ["ComplianceSignalAgent"],
    color: "#6B7280",
    count: "0–1 per week",
  },
];

const STEP_LOGS: Record<number, string[]> = {
  0: [
    "> Orchestrator.run_full_analysis() triggered",
    "> job_id: a7f2b3c4-9d1e-4f2a-b5c6  ·  status: queued → processing",
    "> org: demo-corp  ·  period: last 30 days",
    "> progress: 0%",
  ],
  1: [
    "> [Step 1] BehaviorAnalysisAgent starting...",
    "  Fetching funnel data — 6 stages found",
    "  Loading top_products (30d) — 12 products",
    "  Computing cohort retention matrix",
    "  Done ✓  funnel + cohort_data + top_products ready  ·  progress: 12%",
  ],
  2: [
    "> [Step 2] ChurnPredictionAgent starting...",
    "  cohort_data received from Step 1",
    "  Sentiment trend loaded (30d)",
    "  High-risk segment: Near-Retirement (18.4% at-risk)",
    "  Done ✓  churn_signals ready  ·  progress: 24%",
  ],
  3: [
    "> [Step 3] EngagementScoringAgent starting...",
    "  Aggregating events by segment & channel",
    "  Overall engagement score: 0.72",
    "  Done ✓  segment_scores ready  ·  progress: 36%",
  ],
  4: [
    "> [Step 4] JourneyAbandonmentAgent starting...",
    "  funnel_steps received from Step 1",
    "  KYC drop-off detected at document_upload: 28%",
    "  Done ✓  2 recovery recommendations  ·  progress: 48%",
  ],
  5: [
    "> [Step 5] TrendPredictionAgent starting...",
    "  top_products (Step 1) + churn_signals (Step 2) merged",
    "  GPT-4o generating 5 trend forecasts...",
    "  5 trends written to trend_predictions table",
    "  Done ✓  trend_outputs[] ready  ·  progress: 60%",
  ],
  6: [
    "> [Step 6] ProductAffinityAgent starting...",
    "  Mapping affinity across 4 segments",
    "  ISA propensity: 0.71  ·  BNPL propensity: 0.58",
    "  Done ✓  affinity matrix generated  ·  progress: 72%",
  ],
  7: [
    "> [Step 7] CrossSellIntelligenceAgent starting...",
    "  churn_signals (Step 2) + engagement_scores (Step 3) merged",
    "  Top opportunity: Current Account → ISA (propensity: 0.71)",
    "  Done ✓  3 cross-sell opportunities persisted  ·  progress: 84%",
  ],
  8: [
    "> [Step 8] RecommendationAgent starting (final synthesis)...",
    "  behavior_summary (Step 1) + trend_outputs[] (Step 5) merged",
    "  GPT-4o generating prioritised insights...",
    "  4 insights written to insights table",
    "  Done ✓  pipeline complete  ·  progress: 96%",
  ],
  9: [
    "> [Step 9] ComplianceSignalAgent starting (weekly schedule)...",
    "  Checking FCA Consumer Duty indicators",
    "  TCF breach signal detected — severity: medium",
    "  1 signal written to compliance_signals table",
    "  Done ✓  progress: 100%",
  ],
};

/* ─── Main component ────────────────────────────────── */
export function PipelinePage() {
  const [activeStep, setActiveStep] = useState<number | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isRunning, setIsRunning] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [logLines, setLogLines] = useState<string[]>([]);
  const [expandedStep, setExpandedStep] = useState<number | null>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef(false);

  useEffect(() => {
    return () => {
      cancelRef.current = true;
    };
  }, []);

  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logLines]);

  const simulate = async () => {
    if (isRunning) return;
    cancelRef.current = false;
    setIsRunning(true);
    setIsDone(false);
    setCompletedSteps(new Set());
    setLogLines([]);
    setActiveStep(null);
    setExpandedStep(null);

    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
    const addLine = async (line: string) => {
      if (cancelRef.current) return;
      await sleep(55);
      setLogLines((prev) => [...prev, line]);
    };

    for (const line of STEP_LOGS[0]) await addLine(line);
    await sleep(250);

    for (const s of STEPS) {
      if (cancelRef.current) break;
      setActiveStep(s.step);
      for (const line of STEP_LOGS[s.step] ?? []) await addLine(line);
      await sleep(s.step === 8 ? 500 : 320);
      if (!cancelRef.current) {
        setCompletedSteps((prev) => new Set([...prev, s.step]));
        await sleep(80);
      }
    }

    if (!cancelRef.current) {
      setActiveStep(null);
      setIsRunning(false);
      setIsDone(true);
      await sleep(120);
      setLogLines((prev) => [
        ...prev,
        "",
        "> Pipeline complete ✨  Cache invalidated  ·  Frontend notified",
      ]);
    }
  };

  const reset = () => {
    cancelRef.current = true;
    setIsRunning(false);
    setIsDone(false);
    setActiveStep(null);
    setCompletedSteps(new Set());
    setLogLines([]);
  };

  const getStatus = (step: number): StepStatus => {
    if (activeStep === step) return "active";
    if (completedSteps.has(step)) return "completed";
    return "idle";
  };

  const progress = Math.round((completedSteps.size / STEPS.length) * 100);

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[24px] font-semibold text-[#1A1A1A]">
              AI Pipeline Architecture
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20">
              9 agents
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#0A66C2]/10 text-[#0A66C2] border border-[#0A66C2]/20">
              GPT-4o
            </span>
          </div>
          <p className="text-[14px] text-[#8A8A8A] mt-1">
            Orchestrated multi-agent pipeline that auto-generates insights, trend forecasts, and compliance signals.
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          {(isRunning || isDone) && (
            <button
              onClick={reset}
              className="px-4 py-2 rounded-md text-sm font-medium border border-[#D9D8D3] text-[#4A4A4A] hover:bg-[#F3F2EF] transition-colors"
            >
              Reset
            </button>
          )}
          <button
            onClick={simulate}
            disabled={isRunning}
            className={cn(
              "px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors",
              isRunning
                ? "bg-[#0A66C2]/60 text-white cursor-not-allowed"
                : "bg-[#0A66C2] text-white hover:bg-[#004182]"
            )}
          >
            {isRunning ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Running…
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4" aria-hidden="true">
                  <path d="M8 5v14l11-7z" />
                </svg>
                Simulate Run
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Progress bar ── */}
      {(isRunning || isDone) && (
        <div>
          <div className="flex justify-between text-xs text-[#8A8A8A] mb-1.5">
            <span>
              {isDone
                ? "Pipeline complete — all outputs persisted to Supabase"
                : `Running Step ${activeStep ?? "…"} of ${STEPS.length} — ${STEPS.find((s) => s.step === activeStep)?.label ?? ""}`}
            </span>
            <span className="font-semibold tabular-nums">{progress}%</span>
          </div>
          <div className="h-1.5 bg-[#EAE9E4] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progress}%`,
                backgroundColor: isDone ? "#2D9E6B" : "#0A66C2",
              }}
            />
          </div>
        </div>
      )}

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

        {/* ══ LEFT: Pipeline flow (2 cols) ══ */}
        <div className="lg:col-span-2 space-y-0">

          {/* Triggers */}
          <div className="bg-white border border-[#D9D8D3] rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-[#2D9E6B] animate-pulse" />
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
                Pipeline Triggers
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {TRIGGERS.map((t) => (
                <div
                  key={t.label}
                  className="flex items-start gap-3 p-3 rounded-lg border border-[#D9D8D3] bg-[#F9F9F7]"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: `${t.color}15`, color: t.color }}
                  >
                    {t.icon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[#1A1A1A]">{t.label}</div>
                    <div className="text-xs text-[#8A8A8A] mt-0.5 leading-relaxed">{t.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Connector active={isRunning || isDone} label={null} color="#0A66C2" />

          {/* Orchestrator hub */}
          <div
            className="bg-white rounded-xl p-5 shadow-sm transition-all duration-300"
            style={{
              border: isRunning || isDone ? "2px solid rgba(10,102,194,0.4)" : "2px solid rgba(10,102,194,0.15)",
              boxShadow:
                isRunning || isDone
                  ? "0 0 0 4px rgba(10,102,194,0.07), 0 1px 3px rgba(0,0,0,0.08)"
                  : "0 1px 3px rgba(0,0,0,0.08)",
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-[#0A66C2] flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={1.5} className="w-5 h-5" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-[#1A1A1A]">Orchestrator</div>
                  <div className="text-xs text-[#8A8A8A] mt-0.5">
                    Routes tasks · Tracks job progress in ElastiCache · Invalidates caches on completion
                  </div>
                </div>
              </div>
              <div
                className={cn(
                  "px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 transition-colors duration-300",
                  isDone
                    ? "bg-[#2D9E6B]/10 text-[#2D9E6B]"
                    : isRunning
                    ? "bg-[#0A66C2]/10 text-[#0A66C2]"
                    : "bg-[#EAE9E4] text-[#6B7280]"
                )}
              >
                {isDone ? "✓ Complete" : isRunning ? "● Running" : "Idle"}
              </div>
            </div>
          </div>

          <Connector active={isRunning || isDone} label="dispatches agents in sequence" color="#0A66C2" />

          {/* Agent steps */}
          {STEPS.map((step, idx) => {
            const status = getStatus(step.step);
            const isExpanded = expandedStep === step.step;
            const isLast = idx === STEPS.length - 1;
            const connectorActive =
              completedSteps.has(step.step) || activeStep === (step.step + 1);

            return (
              <div key={step.id}>
                {/* Agent card */}
                <div
                  className={cn(
                    "bg-white rounded-xl shadow-sm transition-all duration-300 cursor-pointer overflow-hidden",
                    status === "completed" && "border border-[#2D9E6B]/30",
                    status === "idle" && "border border-[#D9D8D3] hover:border-[#BDBBB5]"
                  )}
                  style={
                    status === "active"
                      ? {
                          border: `2px solid ${step.color}`,
                          boxShadow: `0 0 0 3px ${step.color}18, 0 4px 16px ${step.color}12`,
                        }
                      : undefined
                  }
                  onClick={() => setExpandedStep(isExpanded ? null : step.step)}
                  role="button"
                  aria-expanded={isExpanded}
                >
                  {/* Card header */}
                  <div
                    className="p-4 flex items-start gap-3"
                    style={
                      status === "active"
                        ? { backgroundColor: step.lightBg }
                        : status === "completed"
                        ? { backgroundColor: "rgba(45,158,107,0.04)" }
                        : undefined
                    }
                  >
                    {/* Step number badge */}
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 mt-0.5 transition-all duration-300",
                        status === "idle" && "bg-[#EAE9E4] text-[#6B7280]",
                        status === "completed" && "bg-[#2D9E6B] text-white"
                      )}
                      style={
                        status === "active"
                          ? { backgroundColor: step.color, color: "white" }
                          : undefined
                      }
                    >
                      {status === "completed" ? (
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : status === "active" ? (
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin block" />
                      ) : (
                        step.step
                      )}
                    </div>

                    {/* Name + tagline */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-[#1A1A1A] text-sm">{step.label}</span>
                        <span className="text-xs font-mono text-[#8A8A8A]">{step.name}</span>
                        {step.weeklyOnly && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-[#EAE9E4] text-[#6B7280] font-medium">
                            weekly
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-[#8A8A8A] mt-0.5 italic">{step.tagline}</div>
                    </div>

                    {/* Right: model tag + expand chevron */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className="px-2 py-0.5 rounded-full text-xs font-medium hidden sm:inline-flex"
                        style={{ backgroundColor: `${step.color}15`, color: step.color }}
                      >
                        gpt-4o
                      </span>
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={2}
                        className={cn(
                          "w-4 h-4 text-[#8A8A8A] transition-transform duration-200",
                          isExpanded && "rotate-180"
                        )}
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded detail panel */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-3 border-t border-[#EAE9E4]">
                      <p className="text-sm text-[#4A4A4A] leading-relaxed mb-4">{step.description}</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8A8A8A] mb-2">
                            Inputs
                          </div>
                          <div className="space-y-1.5">
                            {step.inputs.map((inp) => (
                              <div key={inp} className="flex items-start gap-2 text-xs text-[#4A4A4A]">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#D9D8D3] flex-shrink-0 mt-1" />
                                {inp}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] font-semibold uppercase tracking-wider text-[#8A8A8A] mb-2">
                            Outputs
                          </div>
                          <div className="space-y-1.5">
                            {step.outputs.map((out) => (
                              <div key={out} className="flex items-start gap-2 text-xs text-[#4A4A4A]">
                                <div
                                  className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1"
                                  style={{ backgroundColor: step.color }}
                                />
                                {out}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      {step.feedsInto.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-[#EAE9E4] flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-[#8A8A8A]">Output consumed by:</span>
                          {step.feedsInto.map((n) => (
                            <span
                              key={n}
                              className="px-2 py-0.5 rounded-full text-xs bg-[#EAE9E4] text-[#4A4A4A] font-medium"
                            >
                              Step {n} · {STEPS.find((s) => s.step === n)?.label}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Connector to next step */}
                {!isLast && (
                  <Connector
                    active={connectorActive}
                    label={step.dataPassedDown}
                    color={completedSteps.has(step.step) ? step.color : undefined}
                  />
                )}
              </div>
            );
          })}

          <Connector active={isDone} label="persists outputs to Supabase" color="#2D9E6B" />

          {/* Persistence section */}
          <div
            className="bg-white border rounded-xl p-5 shadow-sm transition-colors duration-300"
            style={{ borderColor: isDone ? "rgba(45,158,107,0.35)" : "#D9D8D3" }}
          >
            <div className="flex items-center gap-2 mb-4">
              <svg viewBox="0 0 24 24" fill="none" stroke="#8A8A8A" strokeWidth={1.5} className="w-4 h-4" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 5.625c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
              </svg>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
                Supabase Persistence
              </span>
              {isDone && (
                <span className="ml-auto px-2 py-0.5 rounded-full text-xs bg-[#2D9E6B]/10 text-[#2D9E6B] font-medium">
                  ✓ Written
                </span>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PERSISTED.map((p) => (
                <div
                  key={p.table}
                  className="p-3 rounded-lg border transition-all duration-500"
                  style={{
                    borderColor: isDone ? `${p.color}35` : "#D9D8D3",
                    backgroundColor: isDone ? `${p.color}06` : "#F9F9F7",
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <code className="text-xs font-mono font-semibold text-[#1A1A1A]">{p.table}</code>
                    <span className="text-[10px] text-[#8A8A8A] tabular-nums">{p.count}</span>
                  </div>
                  <div className="text-xs text-[#6B7280] mb-2 leading-relaxed">{p.description}</div>
                  <div className="flex flex-wrap gap-1">
                    {p.agents.map((a) => (
                      <span key={a} className="text-[10px] px-1.5 py-0.5 rounded bg-[#EAE9E4] text-[#6B7280] font-mono">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ══ RIGHT: Log + stats (1 col, sticky) ══ */}
        <div className="lg:col-span-1">
          <div className="sticky top-4 space-y-4">

            {/* Terminal log */}
            <div className="bg-[#181818] rounded-xl overflow-hidden border border-[#2a2a2a]">
              {/* Window chrome */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2a2a2a]">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-[#FF5F57]" />
                    <div className="w-3 h-3 rounded-full bg-[#FFBD2E]" />
                    <div className="w-3 h-3 rounded-full bg-[#28CA41]" />
                  </div>
                  <span className="text-[11px] text-[#555] ml-1.5 font-mono">pipeline.log</span>
                </div>
                {isRunning && (
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#28CA41] animate-pulse" />
                    <span className="text-[10px] text-[#28CA41] font-mono font-semibold">LIVE</span>
                  </div>
                )}
                {isDone && (
                  <span className="text-[10px] text-[#28CA41] font-mono">DONE</span>
                )}
              </div>

              {/* Log body */}
              <div
                ref={logContainerRef}
                className="h-[480px] overflow-y-auto p-4 font-mono text-[11px] leading-5 scroll-smooth"
              >
                {logLines.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-4">
                    <div className="text-3xl mb-4">▶</div>
                    <div className="text-[#555] text-sm mb-1">
                      Click{" "}
                      <span className="text-[#0A66C2] font-semibold">Simulate Run</span>
                    </div>
                    <div className="text-[#444] text-xs">
                      to watch all 9 agents execute in real time
                    </div>
                  </div>
                ) : (
                  <div className="space-y-0">
                    {logLines.map((line, i) => (
                      <div
                        key={i}
                        className={cn(
                          "leading-5 py-px",
                          line.startsWith(">")
                            ? "text-[#7C3AED] font-semibold"
                            : line.includes("Done ✓")
                            ? "text-[#28CA41]"
                            : line.includes("Pipeline complete")
                            ? "text-[#28CA41] font-semibold"
                            : line === ""
                            ? "py-1"
                            : "text-[#9CA3AF]"
                        )}
                      >
                        {line || " "}
                      </div>
                    ))}
                    {isRunning && (
                      <div className="text-[#7C3AED] animate-pulse mt-0.5">█</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Stats card */}
            <div className="bg-white border border-[#D9D8D3] rounded-xl p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A] mb-3">
                Pipeline Stats
              </div>
              <div className="space-y-2.5">
                {[
                  { label: "Total agents", value: "9", color: "#7C3AED" },
                  { label: "GPT-4o calls / run", value: "8–9", color: "#0A66C2" },
                  { label: "Tables written", value: "3", color: "#2D9E6B" },
                  { label: "Insight cache TTL", value: "30 min", color: "#E8940A" },
                  { label: "Compliance cadence", value: "Weekly", color: "#6B7280" },
                  { label: "Job state storage", value: "ElastiCache", color: "#CC3333" },
                ].map((stat) => (
                  <div key={stat.label} className="flex items-center justify-between">
                    <span className="text-xs text-[#6B7280]">{stat.label}</span>
                    <span className="text-xs font-semibold tabular-nums" style={{ color: stat.color }}>
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Legend */}
            <div className="bg-white border border-[#D9D8D3] rounded-xl p-4 shadow-sm">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#8A8A8A] mb-3">
                Agent Domains
              </div>
              <div className="space-y-2">
                {[
                  { color: "#7C3AED", label: "Behavior & Affinity" },
                  { color: "#CC3333", label: "Risk & Churn" },
                  { color: "#E8940A", label: "Engagement" },
                  { color: "#0A66C2", label: "Journey & Cross-sell" },
                  { color: "#2D9E6B", label: "Prediction & Output" },
                  { color: "#6B7280", label: "Compliance (weekly)" },
                ].map((d) => (
                  <div key={d.label} className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: d.color }} />
                    <span className="text-xs text-[#4A4A4A]">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Connector component ───────────────────────────── */
function Connector({
  active,
  label,
  color,
}: {
  active: boolean;
  label: string | null;
  color?: string;
}) {
  const lineColor = active ? (color ?? "#0A66C2") : "#D9D8D3";
  return (
    <div className="flex flex-col items-center py-0.5">
      <div
        className="w-px h-5 transition-colors duration-400"
        style={{ backgroundColor: lineColor }}
      />
      {label && (
        <div className="px-3 py-0.5 rounded-full text-[10px] font-mono bg-[#F3F2EF] border border-[#D9D8D3] text-[#8A8A8A] my-1 max-w-xs text-center">
          {label}
        </div>
      )}
      <svg width="10" height="6" viewBox="0 0 10 6" aria-hidden="true">
        <path
          d="M5 6L0 0H10L5 6Z"
          style={{ fill: lineColor, transition: "fill 0.4s" }}
        />
      </svg>
    </div>
  );
}
