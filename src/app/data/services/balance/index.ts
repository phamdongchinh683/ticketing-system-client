import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { constant } from '../../constants';
import { BalanceResponse } from '../../interfaces/balance';

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
}
