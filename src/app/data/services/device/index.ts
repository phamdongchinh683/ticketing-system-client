import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { constant } from '../../constants';
import { DeviceFcmToken, SaveDeviceFcmTokenBody } from '../../interfaces/device';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private readonly http: HttpClient) {}

  private authHeaders() {
    return {
      Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
      Accept: 'application/json',
    };
  }

  getFcmTokens(): Observable<DeviceFcmToken[]> {
    return this.http.get<DeviceFcmToken[]>(`${constant.baseUrl}/auth/device/fcm-token`, {
      headers: this.authHeaders(),
    });
  }

  saveFcmToken(body: SaveDeviceFcmTokenBody): Observable<DeviceFcmToken> {
    return this.http.post<DeviceFcmToken>(`${constant.baseUrl}/auth/device/fcm-token`, body, {
      headers: this.authHeaders(),
    });
  }

  deleteFcmToken(id: number): Observable<unknown> {
    return this.http.delete(`${constant.baseUrl}/auth/device/fcm-token/${id}`, {
      headers: this.authHeaders(),
    });
  }
}
