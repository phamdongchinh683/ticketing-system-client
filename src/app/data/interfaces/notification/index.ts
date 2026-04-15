export interface NotificationItem {
  id: number | string;
  userId: number | string;
  title?: string;
  body?: string;
  isRead: boolean;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  next: number | null;
}

export interface NotificationReadResponse {
  message?: string;
}
