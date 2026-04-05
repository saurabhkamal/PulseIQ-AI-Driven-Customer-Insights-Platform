"use client";

import { useState } from "react";
import { notificationsService } from "@/services/notifications.service";

export type PushState = "idle" | "requesting" | "granted" | "denied" | "unsupported";

export function useWebPush() {
  const [state, setState] = useState<PushState>("idle");

  async function subscribe() {
    if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      setState("unsupported");
      return;
    }

    setState("requesting");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setState("denied");
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      });

      const json = sub.toJSON();
      await notificationsService.registerDevice({
        endpoint: sub.endpoint,
        keys: {
          p256dh: json.keys?.p256dh ?? "",
          auth: json.keys?.auth ?? "",
        },
      });

      setState("granted");
    } catch {
      setState("denied");
    }
  }

  return { state, subscribe };
}
