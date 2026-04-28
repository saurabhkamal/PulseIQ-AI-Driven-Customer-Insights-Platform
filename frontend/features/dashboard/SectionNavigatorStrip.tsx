"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useInsights } from "@/hooks/useInsights";
import { useTrends } from "@/hooks/useTrends";
import { useSentimentSummary } from "@/hooks/useSentimentSummary";
import { analyticsService } from "@/services/analytics.service";
import type { FunnelData } from "@/services/analytics.service";
import { Skeleton } from "@/components/ui/Skeleton";

// ─── Shared card shell ────────────────────────────────────────────────────────

interface CardShellProps {
  href: string;
  color: string;
  bg: string;
  border: string;
  isLoading: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
  metric: string;
  metricLabel: string;
  secondary: string;
  chart: React.ReactNode;
}

function CardShell({
  href, color, bg, border, isLoading,
  icon, title, description, metric, metricLabel, secondary, chart,
}: CardShellProps) {
  const [hov, setHov] = useState(false);

  if (isLoading) {
    return (
      <div style={{
        background: "#fff", borderRadius: "10px",
        border: `1px solid ${border}`, borderLeft: `4px solid ${color}`,
        padding: "20px", boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
          <div><Skeleton className="h-4 w-36 mb-1" /><Skeleton className="h-3 w-24" /></div>
          <Skeleton className="h-8 w-16 rounded" />
        </div>
        <Skeleton className="h-8 w-20 mb-1" />
        <Skeleton className="h-3 w-40" />
      </div>
    );
  }

  return (
    <Link href={href} style={{ textDecoration: "none", display: "block" }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: hov ? bg : "#fff",
          borderRadius: "10px",
          border: `1px solid ${hov ? color + "50" : border}`,
          borderLeft: `4px solid ${color}`,
          padding: "20px",
          boxShadow: hov
            ? `0 4px 16px ${color}20, 0 1px 3px rgba(0,0,0,0.06)`
            : "0 1px 3px rgba(0,0,0,0.06)",
          transition: "all 0.18s ease",
          cursor: "pointer",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top: icon + title + chart */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "7px", marginBottom: "2px" }}>
              <span style={{ color, display: "flex", flexShrink: 0 }}>{icon}</span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1A1A1A" }}>{title}</span>
            </div>
            <p style={{ fontSize: "11px", color: "#8A8A8A", margin: 0 }}>{description}</p>
          </div>
          <div style={{ flexShrink: 0 }}>{chart}</div>
        </div>

        {/* Metric */}
        <div style={{ marginBottom: "5px" }}>
          <span style={{ fontSize: "30px", fontWeight: 800, color, lineHeight: 1 }}>{metric}</span>
          <span style={{ fontSize: "12px", color: "#8A8A8A", marginLeft: "6px" }}>{metricLabel}</span>
        </div>

        <p style={{ fontSize: "11px", color: "#6B7280", margin: "0 0 8px" }}>{secondary}</p>

        {/* Explore link */}
        <div style={{
          fontSize: "12px", fontWeight: 700, color,
          display: "inline-flex", alignItems: "center", gap: "3px",
          opacity: hov ? 1 : 0.6, transition: "opacity 0.15s",
        }}>
          Explore
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}

// ─── Behavior card ────────────────────────────────────────────────────────────

function BehaviorSectionCard() {
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyticsService.getFunnelData()
      .then(setFunnel)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const steps     = funnel?.steps ?? [];
  const maxCount  = steps[0]?.count ?? 1;
  const conversion = funnel ? Math.round(funnel.overallConversion) : null;
  const biggestDrop = steps.slice(1).reduce<{ name: string; pct: number } | null>((acc, s) => {
    const pct = Math.round(100 - s.conversionRate);
    return !acc || pct > acc.pct ? { name: s.step, pct } : acc;
  }, null);

  return (
    <CardShell
      href="/analytics/behavior"
      color="#0A66C2"
      bg="rgba(10,102,194,0.05)"
      border="rgba(10,102,194,0.18)"
      isLoading={loading}
      icon={
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M2 20h20M6 20V10M12 20V4M18 20v-6" />
        </svg>
      }
      title="Behavior Analytics"
      description="Funnels, cohorts & heatmaps"
      metric={conversion !== null ? `${conversion}%` : "—"}
      metricLabel="overall conversion"
      secondary={biggestDrop ? `Biggest drop at ${biggestDrop.name} (${biggestDrop.pct}%)` : `${steps.length}-stage funnel tracked`}
      chart={
        steps.length > 0 ? (
          <svg width="56" height="28" viewBox="0 0 56 28">
            {steps.slice(0, 5).map((step, i) => {
              const h = Math.max(3, Math.round((step.count / maxCount) * 24));
              return (
                <rect
                  key={i} x={i * 12} y={28 - h}
                  width="10" height={h} rx="2"
                  fill={`rgba(10,102,194,${0.25 + (i / 4) * 0.75})`}
                  opacity="0.9"
                />
              );
            })}
          </svg>
        ) : null
      }
    />
  );
}

// ─── Insights card ────────────────────────────────────────────────────────────

function InsightsSectionCard() {
  const { insights, isLoading } = useInsights({ limit: 100 });

  const total  = insights.length;
  const high   = insights.filter((i) => i.priority === "high").length;
  const medium = insights.filter((i) => i.priority === "medium").length;
  const low    = insights.filter((i) => i.priority === "low").length;

  return (
    <CardShell
      href="/insights"
      color="#7C3AED"
      bg="rgba(124,58,237,0.05)"
      border="rgba(124,58,237,0.18)"
      isLoading={isLoading}
      icon={
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
      }
      title="AI Insights"
      description="Marketing recommendations"
      metric={String(total)}
      metricLabel="total insights"
      secondary={`${high} high · ${medium} medium · ${low} low priority`}
      chart={
        total > 0 ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px", width: "56px" }}>
            {[
              { count: high,   color: "#CC3333" },
              { count: medium, color: "#E8940A" },
              { count: low,    color: "#9CA3AF" },
            ].map(({ count, color }, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{
                  flex: 1, height: "6px", borderRadius: "99px",
                  background: "#EAE9E4", overflow: "hidden",
                }}>
                  <div style={{
                    height: "100%", borderRadius: "99px", background: color,
                    width: `${total > 0 ? (count / total) * 100 : 0}%`,
                  }} />
                </div>
              </div>
            ))}
          </div>
        ) : null
      }
    />
  );
}

// ─── Trends card ─────────────────────────────────────────────────────────────

function TrendsSectionCard() {
  const { trends, isLoading } = useTrends({ limit: 50 });

  const total   = trends.length;
  const high    = trends.filter((t) => t.signalStrength === "high").length;
  const avgConf = total > 0
    ? Math.round(trends.reduce((s, t) => s + t.confidence, 0) / total)
    : 0;

  return (
    <CardShell
      href="/analytics/trends"
      color="#E8940A"
      bg="rgba(232,148,10,0.05)"
      border="rgba(232,148,10,0.18)"
      isLoading={isLoading}
      icon={
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </svg>
      }
      title="Trend Intelligence"
      description="AI-predicted market signals"
      metric={String(high)}
      metricLabel="high-signal trends"
      secondary={`${total} total forecasts · ${avgConf}% avg confidence`}
      chart={
        total > 0 ? (
          <svg width="56" height="28" viewBox="0 0 56 28">
            {trends.slice(0, 7).map((t, i) => {
              const h = Math.max(3, Math.round((t.confidence / 100) * 24));
              const fill = t.signalStrength === "high" ? "#E8940A" : t.signalStrength === "medium" ? "#FCD34D" : "#D1D5DB";
              return (
                <rect key={i} x={i * 9} y={28 - h} width="7" height={h} rx="2" fill={fill} />
              );
            })}
          </svg>
        ) : null
      }
    />
  );
}

// ─── Sentiment card ───────────────────────────────────────────────────────────

function SentimentSectionCard() {
  const { summary, isLoading } = useSentimentSummary();

  const pos = summary && summary.total > 0 ? Math.round((summary.positive / summary.total) * 100) : 0;
  const neg = summary && summary.total > 0 ? Math.round((summary.negative / summary.total) * 100) : 0;

  return (
    <CardShell
      href="/sentiment"
      color="#2D9E6B"
      bg="rgba(45,158,107,0.05)"
      border="rgba(45,158,107,0.18)"
      isLoading={isLoading}
      icon={
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      }
      title="Sentiment Analysis"
      description="Customer feedback intelligence"
      metric={summary ? `${pos}%` : "—"}
      metricLabel="positive sentiment"
      secondary={
        summary
          ? `${neg}% negative · ${summary.total.toLocaleString()} total reviews`
          : "No feedback processed yet"
      }
      chart={
        summary && summary.total > 0 ? (
          <div style={{ width: "56px" }}>
            <div style={{ display: "flex", height: "10px", borderRadius: "99px", overflow: "hidden" }}>
              <div style={{ flex: summary.positive, background: "#2D9E6B" }} />
              <div style={{ flex: summary.neutral,  background: "#D1D5DB" }} />
              <div style={{ flex: summary.negative, background: "#CC3333" }} />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "3px" }}>
              <span style={{ fontSize: "9px", color: "#2D9E6B", fontWeight: 700 }}>{pos}%</span>
              <span style={{ fontSize: "9px", color: "#CC3333", fontWeight: 700 }}>{neg}%</span>
            </div>
          </div>
        ) : null
      }
    />
  );
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function SectionNavigatorStrip() {
  return (
    <div>
      <div style={{ marginBottom: "12px" }}>
        <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#1A1A1A", margin: "0 0 2px" }}>
          Platform Overview
        </h2>
        <p style={{ fontSize: "12px", color: "#8A8A8A", margin: 0 }}>
          Live snapshot across all analytics sections
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        <BehaviorSectionCard />
        <InsightsSectionCard />
        <TrendsSectionCard />
        <SentimentSectionCard />
      </div>
    </div>
  );
}
