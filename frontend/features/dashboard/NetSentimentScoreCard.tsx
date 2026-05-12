"use client";

import Link from "next/link";
import { useDashboardSummary } from "@/hooks/useDashboardSummary";
import { Skeleton } from "@/components/ui/Skeleton";
import type { NetSentimentWeek } from "@/services/dashboard.service";

const SPK_W = 88;
const SPK_H = 32;
const SPK_PAD = 4;

function Sparkline({ weekly }: { weekly: NetSentimentWeek[] }) {
  if (weekly.length < 2) return null;

  const scores = weekly.map((w) => w.score);
  const minS = Math.min(...scores);
  const maxS = Math.max(...scores);
  const range = maxS - minS || 1;
  const w = SPK_W - SPK_PAD * 2;
  const h = SPK_H - SPK_PAD * 2;

  const pts = scores.map((s, i) => {
    const x = SPK_PAD + (i / (scores.length - 1)) * w;
    const y = SPK_PAD + (1 - (s - minS) / range) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const lastScore = scores[scores.length - 1];
  const lineColor = lastScore >= 0 ? "#2D9E6B" : "#CC3333";

  const areaPath =
    `M${pts[0]} ` +
    pts.slice(1).map((p) => `L${p}`).join(" ") +
    ` L${(SPK_PAD + w).toFixed(1)},${(SPK_PAD + h).toFixed(1)} L${SPK_PAD},${(SPK_PAD + h).toFixed(1)} Z`;

  return (
    <svg viewBox={`0 0 ${SPK_W} ${SPK_H}`} className="w-[88px] h-8" aria-label="Sentiment trend sparkline">
      <defs>
        <linearGradient id="spkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity="0.3" />
          <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#spkGrad)" />
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={lineColor}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function NetSentimentScoreCard() {
  const { data, isLoading, error } = useDashboardSummary();

  if (isLoading) {
    return (
      <div className="bg-white border border-[#D9D8D3] rounded-xl p-5 shadow-sm">
        <Skeleton className="h-4 w-36 mb-3" />
        <Skeleton className="h-12 w-24 mb-2" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  const nss = data?.net_sentiment ?? {
    score: 0,
    positive_pct: 0,
    negative_pct: 0,
    weekly: [],
  };

  const scoreColor =
    nss.score > 20 ? "#2D9E6B" : nss.score > 0 ? "#E8940A" : "#CC3333";
  const scorePrefix = nss.score > 0 ? "+" : "";

  return (
    <div className="bg-white border border-[#D9D8D3] rounded-xl p-5 shadow-sm">
      <div className="flex items-start justify-between mb-1">
        <div>
          <h3 className="text-[15px] font-semibold text-[#1A1A1A]">Net Sentiment</h3>
          <p className="text-[12px] text-[#8A8A8A] mt-0.5">Positive − Negative %</p>
        </div>
        <Link
          href="/sentiment"
          className="text-[12px] text-[#0A66C2] hover:text-[#004182] font-medium transition-colors flex-shrink-0"
        >
          Details →
        </Link>
      </div>

      <div className="flex items-end justify-between mt-3">
        <div>
          <div
            className="text-[42px] font-bold leading-none tabular-nums"
            style={{ color: scoreColor }}
          >
            {scorePrefix}{nss.score.toFixed(0)}
          </div>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-[11px] text-[#2D9E6B] font-medium">
              ↑ {nss.positive_pct.toFixed(1)}%
            </span>
            <span className="text-[11px] text-[#CC3333] font-medium">
              ↓ {nss.negative_pct.toFixed(1)}%
            </span>
          </div>
        </div>
        <Sparkline weekly={nss.weekly} />
      </div>

      <p className="text-[11px] text-[#8A8A8A] mt-3 border-t border-[#EAE9E4] pt-2">
        Based on all customer feedback
      </p>
    </div>
  );
}
