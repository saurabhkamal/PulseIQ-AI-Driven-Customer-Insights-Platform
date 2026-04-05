import type { Metadata } from "next";
import { MobileNotifications } from "@/features/notifications/MobileNotifications";

export const metadata: Metadata = { title: "Alerts — PulseIQ" };

export default function NotificationsPage() {
  return <MobileNotifications />;
}
