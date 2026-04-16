export interface NotificationItem {
  id: number | string;
  userId: number | string;
  title?: string;
  body?: string;
  data?: string | Record<string, unknown> | null;
  isRead: boolean;
}

export interface NotificationListResponse {
  notifications: NotificationItem[];
  next: number | null;
}

export interface NotificationReadResponse {
  message?: string;
}

export type VerifyAccountStatus = 'active' | 'inactive' | 'banned';

export interface VerifyAccountRequest {
  id: number;
  status: VerifyAccountStatus;
}

export interface VerifyAccountResponse extends VerifyAccountRequest {}
