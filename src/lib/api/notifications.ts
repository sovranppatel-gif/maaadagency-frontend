import type { AppNotification, NotificationCategory } from "@/lib/types";
import { http, toQueryString } from "../http";

export interface NotificationPageFilters {
  page?: number;
  limit?: number;
  category?: NotificationCategory | "All";
  unreadOnly?: boolean;
}

export interface NotificationPageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  unread: number;
}

export async function getNotifications(
  category: NotificationCategory | "All" = "All",
  unreadOnly = false
): Promise<AppNotification[]> {
  const { notifications } = await getNotificationsPage({
    category,
    unreadOnly,
    limit: 100,
  });
  return notifications;
}

export async function getNotificationsPage(
  filters: NotificationPageFilters = {}
): Promise<{ notifications: AppNotification[]; meta: NotificationPageMeta }> {
  const qs = toQueryString({
    ...filters,
    unreadOnly: filters.unreadOnly ? "true" : undefined,
  });
  const response = await http.get<{ data: AppNotification[]; meta: NotificationPageMeta }>(
    `/notifications${qs}`,
    { withMeta: true, cache: "no-store" }
  );
  return { notifications: response.data, meta: response.meta };
}

export async function markAllRead(): Promise<void> {
  await http.patch("/notifications/read-all");
}

export async function markRead(id: string, read = true): Promise<void> {
  await http.patch(`/notifications/${id}/read`, { read });
}

export async function getUnreadCount(): Promise<number> {
  const res = await http.get<{ unread: number }>("/notifications/unread-count", { cache: "no-store" });
  return res.unread;
}
