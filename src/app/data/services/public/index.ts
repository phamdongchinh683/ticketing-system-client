import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { constant } from '../../constants';
import { CompanyListResponse } from '../../interfaces/company';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  getCompanies(limit: number, next?: number, name?: string): Observable<CompanyListResponse> {
    const params: Record<string, string> = { limit: String(limit) };
    if (next !== undefined && next !== null) params['next'] = String(next);
    if (name) params['name'] = name;

    return this.http.get<CompanyListResponse>(`${constant.baseUrl}/public/company`, { params });
  }
}
