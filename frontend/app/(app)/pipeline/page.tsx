import type { Metadata } from "next";
import { PipelinePage } from "@/features/pipeline/PipelinePage";

export const metadata: Metadata = {
  title: "AI Pipeline — PulseIQ",
};

export default function Pipeline() {
  return <PipelinePage />;
}
