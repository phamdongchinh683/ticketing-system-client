import { inject, Injectable } from '@angular/core';
import { Messaging } from '@angular/fire/messaging';
import { getToken, isSupported } from 'firebase/messaging';
import { catchError, from, map, Observable, of, switchMap } from 'rxjs';

import { firebaseVapidKey } from '@app/data/constants';
import { device } from '@app/data/services';

export interface EnsureFcmTokenResult {
  ok: boolean;
  reason?: 'permission-denied' | 'token-unavailable' | 'register-failed';
}

@Injectable({ providedIn: 'root' })
export class FcmDeviceService {
  private readonly deviceApi = inject(device.ApiService);
  private readonly messaging = inject(Messaging);
  private preparedToken: string | null = null;

  prepareTokenBeforeLogin(): Observable<boolean> {
    return from(this.getCurrentFcmToken(true)).pipe(
      map((token) => {
        this.preparedToken = token;
        return !!token;
      }),
      catchError(() => of(false)),
    );
  }

  ensureRegistered(requirePermission = false): Observable<EnsureFcmTokenResult> {
    const tokenSource = this.preparedToken
      ? of(this.preparedToken)
      : from(this.getCurrentFcmToken(requirePermission));

    return tokenSource.pipe(
      switchMap((fcmToken) => {
        this.preparedToken = null;
        if (!fcmToken) {
          return of<EnsureFcmTokenResult>({
            ok: false,
            reason: requirePermission ? 'permission-denied' : 'token-unavailable',
          });
        }

        return this.deviceApi.getFcmTokens().pipe(
          switchMap((tokens) => {
            const existing = tokens.find((item) => item.fcmToken === fcmToken);
            if (existing) return of<EnsureFcmTokenResult>({ ok: true });

            return this.deviceApi.saveFcmToken({ fcmToken }).pipe(
              map(() => ({ ok: true as const })),
              catchError(() => of<EnsureFcmTokenResult>({ ok: false, reason: 'register-failed' })),
            );
          }),
          catchError(() => of<EnsureFcmTokenResult>({ ok: false, reason: 'register-failed' })),
        );
      }),
      catchError(() => of<EnsureFcmTokenResult>({ ok: false, reason: 'token-unavailable' })),
    );
  }

  removeCurrentDeviceToken(): Observable<void> {
    return from(this.getCurrentFcmToken(false)).pipe(
      switchMap((fcmToken) => {
        if (!fcmToken) return of(void 0);
        return this.deviceApi.getFcmTokens().pipe(
          switchMap((tokens) => {
            const currentDevice = tokens.find((item) => item.fcmToken === fcmToken);
            if (!currentDevice) return of(void 0);
            return this.deviceApi.deleteFcmToken(currentDevice.id).pipe(map(() => void 0));
          }),
          catchError(() => of(void 0)),
        );
      }),
      catchError(() => of(void 0)),
    );
  }

  private async getCurrentFcmToken(requestPermission: boolean): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    if (!(await isSupported())) return null;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;

    if (requestPermission && 'Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return null;
    }

    const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (!registration) return null;

    try {
      const token = await getToken(this.messaging, {
        vapidKey: firebaseVapidKey,
        serviceWorkerRegistration: registration,
      });
      return token || null;
    } catch {
      return null;
    }
  }
}
