import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PulseIQ Admin",
  description: "PulseIQ Admin Panel — organization management and platform configuration.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
