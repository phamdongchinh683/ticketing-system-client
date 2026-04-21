import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { constant } from '../../constants';
import {
  NotificationListResponse,
  NotificationReadResponse,
  VerifyAccountRequest,
  VerifyAccountResponse,
} from '../../interfaces/notification';
import { buildCacheKey, CacheEntry, clearCacheByPrefix, readCache, writeCache } from '../cache-utils';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly notificationCache = new Map<string, CacheEntry<NotificationListResponse>>();
  private readonly NOTIFICATION_TTL_MS = 15 * 1000;

  constructor(private readonly http: HttpClient) {}

  getNotifications(next?: number): Observable<NotificationListResponse> {
    const params: Record<string, string> = {};
    if (next !== undefined && next !== null) params['next'] = String(next);

    const cacheKey = buildCacheKey('notifications', params);
    const cached = readCache(this.notificationCache, cacheKey);
    if (cached) return of(cached);

    return this.http
      .get<NotificationListResponse>(`${constant.baseUrl}/auth/notification?limit=10`, {
        params,
        headers: { Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` },
      })
      .pipe(tap((res) => writeCache(this.notificationCache, cacheKey, res, this.NOTIFICATION_TTL_MS)));
  }

  markAsRead(notificationId: number | string): Observable<NotificationReadResponse> {
    return this.http
      .put<NotificationReadResponse>(
        `${constant.baseUrl}/auth/notification/${encodeURIComponent(String(notificationId))}/read`,
        {},
        { headers: { Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` } },
      )
      .pipe(tap(() => clearCacheByPrefix(this.notificationCache, 'notifications')));
  }

  verifyAccount(payload: VerifyAccountRequest): Observable<VerifyAccountResponse> {
    return this.http.post<VerifyAccountResponse>(`${constant.baseUrl}/auth/verify-account`, payload, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token') ?? ''}` },
    });
  }
}
