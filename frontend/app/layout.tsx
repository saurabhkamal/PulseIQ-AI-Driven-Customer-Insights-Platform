import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PulseIQ — Consumer Insights Platform",
  description:
    "AI-driven consumer behavior analysis, trend prediction, and marketing insights for e-commerce and retail.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
