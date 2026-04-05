import type { Metadata } from "next";
import { MobileSentiment } from "@/features/sentiment/MobileSentiment";

export const metadata: Metadata = { title: "Sentiment — PulseIQ" };

export default function SentimentPage() {
  return <MobileSentiment />;
}
