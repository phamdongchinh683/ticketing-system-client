import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { constant } from '../../constants';
import { DashboardResponse } from '../../interfaces/dashboard';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  getDashboard(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${constant.baseUrl}/super-admin/dashboard`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
  }
}
