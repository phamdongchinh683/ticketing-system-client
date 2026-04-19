import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { constant } from '../../constants';
import { DashboardResponse } from '../../interfaces/dashboard';
import type { RevenueExportQuery } from '../../interfaces/dashboard/revenue-export';
import type { DashboardStatsQuery } from '../../interfaces/dashboard/stats';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  private authHeaders() {
    return {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      Accept: 'application/json',
    };
  }

  private authHeadersExport() {
    return {
      Authorization: `Bearer ${localStorage.getItem('token')}`,
      Accept:
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream, application/json, */*',
    };
  }

  private revenueExportParams(q: RevenueExportQuery): HttpParams {
    return new HttpParams()
      .set('type', q.type)
      .set('method', q.method)
      .set('year', String(q.year));
  }

  private statsParams(q: DashboardStatsQuery): HttpParams {
    let p = new HttpParams().set('type', q.type);
    if (q.year != null && q.year !== undefined) p = p.set('year', String(q.year));
    if (q.month != null && q.month !== undefined) p = p.set('month', String(q.month));
    if (q.status) p = p.set('status', q.status);
    if (q.role) p = p.set('role', q.role);
    if (q.method) p = p.set('method', q.method);
    return p;
  }

  getDashboard(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${constant.baseUrl}/super-admin/dashboard`, {
      headers: this.authHeaders(),
    });
  }

  /** Raw JSON — shape varies; normalize with dashboard-stats.mapper */
  getDashboardBooking(q: DashboardStatsQuery): Observable<unknown> {
    return this.http.get(`${constant.baseUrl}/super-admin/dashboard/booking`, {
      headers: this.authHeaders(),
      params: this.statsParams(q),
    });
  }

  getDashboardRevenue(q: DashboardStatsQuery): Observable<unknown> {
    return this.http.get(`${constant.baseUrl}/super-admin/dashboard/revenue`, {
      headers: this.authHeaders(),
      params: this.statsParams(q),
    });
  }

  getDashboardUser(q: DashboardStatsQuery): Observable<unknown> {
    return this.http.get(`${constant.baseUrl}/super-admin/dashboard/user`, {
      headers: this.authHeaders(),
      params: this.statsParams(q),
    });
  }

  exportRevenueReport(q: RevenueExportQuery): Observable<HttpResponse<Blob>> {
    return this.http.get(`${constant.baseUrl}/super-admin/dashboard/revenue/export`, {
      headers: this.authHeadersExport(),
      params: this.revenueExportParams(q),
      responseType: 'blob',
      observe: 'response',
    });
  }
}
