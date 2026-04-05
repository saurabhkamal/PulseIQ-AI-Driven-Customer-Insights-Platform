"use client";

import { useEffect, useState } from "react";
import { MobileShell } from "@/components/layout/MobileShell";
import { useWebPush } from "@/hooks/useWebPush";
import { useAsync } from "@/hooks/useAsync";
import { notificationsService, type NotificationRecord } from "@/services/notifications.service";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatRelativeTime } from "@/lib/utils";

const TYPE_LABELS: Record<NotificationRecord["type"], string> = {
  insight: "Insight",
  trend: "Trend",
  sentiment: "Sentiment",
  ingestion: "Ingestion",
};

const TYPE_VARIANT: Record<NotificationRecord["type"], "ai" | "brand" | "warning" | "neutral"> = {
  insight: "ai",
  trend: "brand",
  sentiment: "warning",
  ingestion: "neutral",
};

export function MobileNotifications() {
  const { state, subscribe } = useWebPush();
  const { data: notifications, isLoading, error } = useAsync(() => notificationsService.getNotifications());
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  // Mark notification as read on tap
  async function handleMarkRead(id: string) {
    if (readIds.has(id)) return;
    try {
      await notificationsService.markRead(id);
      setReadIds((prev) => new Set([...prev, id]));
    } catch {
      // Non-critical — silently ignore
    }
  }

  const list: NotificationRecord[] = notifications ?? [];
  const unreadCount = list.filter((n) => !n.isRead && !readIds.has(n.id)).length;

  return (
    <MobileShell title="Alerts">
      {/* Push Notification Toggle */}
      <section>
        <div className="bg-white rounded-xl border border-[#D9D8D3] p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-[14px] font-semibold text-[#1A1A1A]">Push Notifications</p>
              <p className="text-[12px] text-[#8A8A8A] mt-0.5">
                {state === "granted"
                  ? "Notifications are enabled"
                  : state === "denied"
                  ? "Notifications were denied — enable in browser settings"
                  : state === "unsupported"
                  ? "Push notifications not supported on this device"
                  : state === "requesting"
                  ? "Requesting permission…"
                  : "Enable to receive real-time AI alerts"}
              </p>
            </div>

            {state === "idle" && (
              <button
                onClick={subscribe}
                className="shrink-0 px-4 py-2 bg-[#0A66C2] text-white text-[13px] font-medium rounded-lg min-h-[44px] active:opacity-80 transition-opacity"
              >
                Enable
              </button>
            )}
            {state === "granted" && (
              <span className="shrink-0 text-[#2D9E6B] text-[13px] font-medium">✓ On</span>
            )}
            {state === "denied" && (
              <span className="shrink-0 text-[#CC3333] text-[13px] font-medium">Blocked</span>
            )}
            {state === "requesting" && (
              <span className="shrink-0 text-[#8A8A8A] text-[13px]">…</span>
            )}
          </div>
        </div>
      </section>

      {/* Notification History */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[12px] font-semibold uppercase tracking-wider text-[#8A8A8A]">
            History
          </h2>
          {unreadCount > 0 && (
            <span className="text-[11px] font-medium text-white bg-[#0A66C2] rounded-full px-2 py-0.5">
              {unreadCount} new
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-[#D9D8D3] px-4 py-3">
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-4 w-3/4 mb-1" />
                <Skeleton className="h-3 w-full" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl p-4 border border-[#D9D8D3] text-center text-[13px] text-[#CC3333]">
            Failed to load notifications.
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            title="No notifications yet"
            description="Enable push notifications to receive AI insights and trend alerts in real time."
          />
        ) : (
          <div className="space-y-2">
            {list.map((notif) => {
              const isRead = notif.isRead || readIds.has(notif.id);
              return (
                <button
                  key={notif.id}
                  onClick={() => handleMarkRead(notif.id)}
                  className={`w-full text-left rounded-xl border border-[#D9D8D3] px-4 py-3 transition-colors ${
                    isRead ? "bg-white" : "bg-[#F0F7FF]"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={TYPE_VARIANT[notif.type]}>
                        {TYPE_LABELS[notif.type]}
                      </Badge>
                      {!isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#0A66C2] shrink-0" />
                      )}
                    </div>
                    <span className="text-[11px] text-[#8A8A8A] shrink-0">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-[13px] font-semibold text-[#1A1A1A] leading-snug mb-0.5">
                    {notif.title}
                  </p>
                  <p className="text-[12px] text-[#4A4A4A] line-clamp-2">{notif.body}</p>
                </button>
              );
            })}
          </div>
        )}
      </section>
    </MobileShell>
  );
}
