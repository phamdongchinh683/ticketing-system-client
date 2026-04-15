import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { constant } from '../../constants';
import { NotificationListResponse, NotificationReadResponse } from '../../interfaces/notification';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private readonly http: HttpClient) {}

  getNotifications(next?: number): Observable<NotificationListResponse> {
    const params: Record<string, string> = {};
    if (next !== undefined && next !== null) params['next'] = String(next);

    return this.http.get<NotificationListResponse>(`${constant.baseUrl}/auth/notification`, {
      params,
      headers: { Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` },
    });
  }

  markAsRead(notificationId: number | string): Observable<NotificationReadResponse> {
    return this.http.put<NotificationReadResponse>(
      `${constant.baseUrl}/auth/notification/${encodeURIComponent(String(notificationId))}/read`,
      {},
      { headers: { Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` } },
    );
  }
}
