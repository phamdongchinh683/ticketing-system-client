import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { constant } from '../../constants';
import { BalanceResponse } from '../../interfaces/balance';

export interface WithdrawBalanceRequest {
  amount: number;
}

export interface WithdrawBalanceResponse {
  message: string;
  amountVnd: number;
  amountUsdCents: number;
}

export interface PayoutItem {
  id: string;
  amount: number;
  currency: string;
  status: string;
  arrival_date: number;
  created: number;
}

export interface PayoutListResponse {
  payouts: PayoutItem[];
  next: string | null;
}

export type PayoutStatus = 'paid' | 'pending' | 'in_transit' | 'canceled' | 'failed';

export interface PayoutListQuery {
  limit?: number;
  status?: PayoutStatus;
  next?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  private authHeaders() {
    return {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      Accept: 'application/json',
    };
  }

  getBalance(): Observable<BalanceResponse> {
    return this.http.get<BalanceResponse>(`${constant.baseUrl}/super-admin/balance`, {
      headers: this.authHeaders(),
    });
  }

  withdrawBalance(payload: WithdrawBalanceRequest): Observable<WithdrawBalanceResponse> {
    return this.http.post<WithdrawBalanceResponse>(`${constant.baseUrl}/super-admin/balance/withdraw`, payload, {
      headers: this.authHeaders(),
    });
  }

  getPayouts(query: PayoutListQuery = {}): Observable<PayoutListResponse> {
    let params = new HttpParams();
    if (query.limit != null) {
      params = params.set('limit', String(query.limit));
    }
    if (query.status) {
      params = params.set('status', query.status);
    }
    if (query.next) {
      params = params.set('next', query.next);
    }

    return this.http.get<PayoutListResponse>(`${constant.baseUrl}/super-admin/balance/payout`, {
      headers: this.authHeaders(),
      params,
    });
  }
}
