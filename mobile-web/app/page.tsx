import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PulseIQ — AI-Driven Consumer Insights",
  description:
    "Analyze consumer behavior, predict market trends, and act on AI recommendations — right from your phone.",
};

const FEATURES = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
      </svg>
    ),
    title: "Live KPI Dashboard",
    description: "Revenue, orders, and top products updated in real time.",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
      </svg>
    ),
    title: "Trend Prediction",
    description: "GPT-4o forecasts emerging trends before competitors spot them.",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    title: "AI Insights",
    description: "Prioritized marketing actions generated from your own data.",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
      </svg>
    ),
    title: "Sentiment Analysis",
    description: "Classify customer reviews instantly — positive, neutral, negative.",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
      </svg>
    ),
    title: "Push Alerts",
    description: "Get notified when AI surfaces a high-priority insight for your org.",
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
      </svg>
    ),
    title: "Secure & Multi-Tenant",
    description: "RBAC, JWT auth, SSO, and full GDPR audit trails built in.",
  },
];

const HOW_IT_WORKS = [
  { step: "1", title: "Ingest", desc: "Push sales, product, and customer data via REST API or CSV upload." },
  { step: "2", title: "Process", desc: "ETL pipeline validates and normalizes your data automatically." },
  { step: "3", title: "Analyze", desc: "AI agents run behavior analysis, sentiment scoring, and trend forecasting." },
  { step: "4", title: "Act", desc: "Prioritized recommendations land on your mobile dashboard, ready to execute." },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F3F2EF]">

      {/* Top nav */}
      <header className="sticky top-0 z-40 bg-white border-b border-[#D9D8D3]">
        <div className="px-4 h-14 flex items-center justify-between max-w-[480px] mx-auto">
          <span className="text-[18px] font-bold text-[#0A66C2] tracking-tight">PulseIQ</span>
          <Link
            href="/dashboard"
            className="h-9 px-4 inline-flex items-center rounded-lg bg-[#0A66C2] text-white text-[13px] font-semibold active:opacity-80 transition-opacity"
          >
            Open app
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="px-4 pt-10 pb-8 max-w-[480px] mx-auto">
        {/* AI badge */}
        <div className="inline-flex items-center gap-2 bg-[#7C3AED]/10 border border-[#7C3AED]/20 rounded-full px-3 py-1 mb-5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7C3AED]" aria-hidden="true" />
          <span className="text-[12px] font-medium text-[#7C3AED]">Powered by GPT-4o Agentic AI</span>
        </div>

        <h1 className="text-[30px] font-bold text-[#1A1A1A] leading-tight tracking-tight mb-4">
          Consumer Insights,{" "}
          <span className="text-[#0A66C2]">Driven by AI</span>
        </h1>
        <p className="text-[15px] text-[#4A4A4A] leading-relaxed mb-7">
          PulseIQ helps e-commerce and retail teams understand customer behavior,
          predict trends, and act on AI recommendations — right from your phone.
        </p>

        {/* CTA buttons */}
        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="h-12 w-full inline-flex items-center justify-center rounded-xl bg-[#0A66C2] text-white text-[15px] font-semibold active:opacity-80 transition-opacity shadow-sm"
          >
            View demo dashboard
          </Link>
          <Link
            href="/login"
            className="h-12 w-full inline-flex items-center justify-center rounded-xl bg-white border border-[#D9D8D3] text-[#1A1A1A] text-[15px] font-medium active:bg-[#F3F2EF] transition-colors"
          >
            Sign in to your account
          </Link>
        </div>

        {/* PWA install hint */}
        <p className="mt-5 text-[12px] text-[#8A8A8A] text-center">
          📲 Add to Home Screen for the full app experience
        </p>
      </section>

      {/* Stats strip */}
      <section className="bg-white border-y border-[#D9D8D3] py-6 px-4">
        <div className="grid grid-cols-4 gap-2 text-center max-w-[480px] mx-auto">
          {[
            { value: "4", label: "AI Agents" },
            { value: "GPT-4o", label: "Model" },
            { value: "4", label: "Roles" },
            { value: "GDPR", label: "Compliant" },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-[16px] font-bold text-[#0A66C2]">{s.value}</p>
              <p className="text-[10px] text-[#8A8A8A] mt-0.5 leading-tight">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-8 max-w-[480px] mx-auto">
        <h2 className="text-[18px] font-bold text-[#1A1A1A] mb-1">Everything in one place</h2>
        <p className="text-[13px] text-[#8A8A8A] mb-5">Six core capabilities, all on mobile.</p>

        <div className="space-y-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-white rounded-xl border border-[#D9D8D3] p-4 flex items-start gap-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
            >
              <div className="shrink-0 h-9 w-9 rounded-lg bg-[#0A66C2]/10 flex items-center justify-center text-[#0A66C2]">
                {f.icon}
              </div>
              <div>
                <p className="text-[14px] font-semibold text-[#1A1A1A]">{f.title}</p>
                <p className="text-[13px] text-[#4A4A4A] mt-0.5 leading-snug">{f.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-white border-y border-[#D9D8D3] px-4 py-8">
        <div className="max-w-[480px] mx-auto">
          <h2 className="text-[18px] font-bold text-[#1A1A1A] mb-1">How it works</h2>
          <p className="text-[13px] text-[#8A8A8A] mb-5">From raw data to actionable insight in four steps.</p>

          <div className="space-y-0">
            {HOW_IT_WORKS.map((item, i) => (
              <div key={item.step} className="flex gap-4">
                {/* Step connector */}
                <div className="flex flex-col items-center">
                  <div className="h-8 w-8 shrink-0 rounded-full bg-[#0A66C2] text-white text-[13px] font-bold flex items-center justify-center">
                    {item.step}
                  </div>
                  {i < HOW_IT_WORKS.length - 1 && (
                    <div className="w-px flex-1 bg-[#D9D8D3] my-1" aria-hidden="true" />
                  )}
                </div>
                {/* Content */}
                <div className={`pb-5 ${i === HOW_IT_WORKS.length - 1 ? "" : ""}`}>
                  <p className="text-[14px] font-semibold text-[#1A1A1A] mt-0.5">{item.title}</p>
                  <p className="text-[13px] text-[#4A4A4A] mt-1 leading-snug">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roles */}
      <section className="px-4 py-8 max-w-[480px] mx-auto">
        <h2 className="text-[18px] font-bold text-[#1A1A1A] mb-1">Built for every team member</h2>
        <p className="text-[13px] text-[#8A8A8A] mb-5">Role-based access for each person's needs.</p>

        <div className="grid grid-cols-2 gap-3">
          {[
            { role: "Admin", color: "#0A66C2", desc: "Full access — users, data sources, API keys, audit logs." },
            { role: "Analyst", color: "#2D9E6B", desc: "Dashboards, analytics, AI insights, and sentiment." },
            { role: "Marketer", color: "#E8940A", desc: "AI recommendations, sentiment summaries, and exports." },
            { role: "Viewer", color: "#6B7280", desc: "Read-only access to assigned dashboards only." },
          ].map((item) => (
            <div
              key={item.role}
              className="bg-white rounded-xl border border-[#D9D8D3] p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]"
            >
              <span
                className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white mb-2"
                style={{ backgroundColor: item.color }}
              >
                {item.role}
              </span>
              <p className="text-[12px] text-[#4A4A4A] leading-snug">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="bg-[#0A66C2] px-4 py-10">
        <div className="max-w-[480px] mx-auto text-center">
          <h2 className="text-[22px] font-bold text-white mb-2">
            Ready to understand your customers?
          </h2>
          <p className="text-[14px] text-white/80 mb-6 leading-relaxed">
            Connect your data source and get your first AI insights in minutes.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center h-12 px-8 rounded-xl bg-white text-[#0A66C2] text-[15px] font-semibold active:opacity-80 transition-opacity"
          >
            Get started free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-[#D9D8D3] px-4 py-6">
        <div className="max-w-[480px] mx-auto flex flex-col items-center gap-3">
          <span className="text-[16px] font-bold text-[#0A66C2]">PulseIQ</span>
          <div className="flex items-center gap-5 text-[13px] text-[#4A4A4A]">
            <a href="#" className="active:text-[#0A66C2]">Privacy</a>
            <a href="#" className="active:text-[#0A66C2]">Terms</a>
            <Link href="/login" className="active:text-[#0A66C2]">Sign in</Link>
          </div>
          <p className="text-[12px] text-[#8A8A8A]">
            &copy; {new Date().getFullYear()} PulseIQ. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
