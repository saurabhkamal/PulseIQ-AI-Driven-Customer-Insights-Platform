import type { Metadata } from "next";
import { SentimentOverview } from "@/features/sentiment/SentimentOverview";
import { SentimentTable } from "@/features/sentiment/SentimentTable";

export const metadata: Metadata = {
  title: "Sentiment Analysis — PulseIQ",
};

export default function SentimentPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[24px] font-semibold text-[#1A1A1A]">Sentiment Analysis</h1>
        <p className="text-[14px] text-[#8A8A8A] mt-1">
          Customer feedback classified by AI — positive, neutral, and negative.
        </p>
      </div>
      <SentimentOverview />
      <SentimentTable />
    </div>
  );
}
