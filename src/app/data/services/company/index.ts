import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { constant } from '../../constants';
import { CompanyListResponse, CreateCompanyResponse } from '../../interfaces/company';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  getCompanies(limit: number, next?: number, name?: string): Observable<CompanyListResponse> {
    const params: Record<string, string> = { limit: String(limit) };
    if (next !== undefined && next !== null) params['next'] = String(next);
    if (name) params['name'] = name;

    return this.http.get<CompanyListResponse>(`${constant.baseUrl}/super-admin/bus-company`, {
      params,
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
  }

  createCompany(name: string, hotline: string, logoUrl: string): Observable<CreateCompanyResponse> {
    return this.http.post<CreateCompanyResponse>(
      `${constant.baseUrl}/super-admin/bus-company`,
      {
        name,
        hotline,
        logoUrl,
      },
      {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      },
    );
  }

  updateCompany(
    id: number,
    data: Partial<{ name: string; hotline: string; logoUrl: string }>,
  ): Observable<CreateCompanyResponse> {
    return this.http.put<CreateCompanyResponse>(`${constant.baseUrl}/super-admin/bus-company/${id}`, data, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
  }

  deleteCompany(id: number): Observable<CreateCompanyResponse> {
    return this.http.delete<CreateCompanyResponse>(`${constant.baseUrl}/super-admin/bus-company/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
  }
}
