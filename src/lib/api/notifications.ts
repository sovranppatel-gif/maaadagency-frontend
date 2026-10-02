import type { AppNotification, NotificationCategory } from "@/lib/types";
import { http, toQueryString } from "../http";

export async function getNotifications(
  category: NotificationCategory | "All" = "All",
  unreadOnly = false
): Promise<AppNotification[]> {
  const qs = toQueryString({ category, unreadOnly: unreadOnly ? "true" : undefined, limit: 100 });
  return http.get<AppNotification[]>(`/notifications${qs}`);
}

export async function markAllRead(): Promise<void> {
  await http.patch("/notifications/read-all");
}

export async function markRead(id: string): Promise<void> {
  await http.patch(`/notifications/${id}/read`);
}

export async function getUnreadCount(): Promise<number> {
  const res = await http.get<{ unread: number }>("/notifications/unread-count");
  return res.unread;
}
