import { apiClient } from "@/lib/api-client";
import type { PushSubscriptionData } from "@/types";

export interface NotificationRecord {
  id: string;
  title: string;
  body: string;
  type: "insight" | "trend" | "sentiment" | "ingestion";
  isRead: boolean;
  createdAt: string;
}

export const notificationsService = {
  registerDevice: (subscription: PushSubscriptionData) =>
    apiClient.post<{ id: string }>("/mobile/device-tokens", { subscription }),

  getNotifications: () =>
    apiClient.get<NotificationRecord[]>("/mobile/notifications"),

  markRead: (id: string) =>
    apiClient.post<void>(`/mobile/notifications/${id}/read`),
};
