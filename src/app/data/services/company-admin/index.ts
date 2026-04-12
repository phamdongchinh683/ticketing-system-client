import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { constant } from '../../constants';
import {
  CompanyAdminListResponse,
  CreateCompanyAdminBody,
  UpdateCompanyAdminBody,
} from '../../interfaces/company-admin';

export interface CompanyAdminFilters {
  limit: number;
  next?: number;
  name?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  private authHeaders() {
    return {
      Authorization: `Bearer ${localStorage.getItem('token') ?? ''}`,
      Accept: 'application/json',
    };
  }

  private jsonAuthHeaders() {
    return {
      ...this.authHeaders(),
      'Content-Type': 'application/json',
    };
  }

  getCompanyAdmins(filters: CompanyAdminFilters): Observable<CompanyAdminListResponse> {
    const params: Record<string, string> = { limit: String(filters.limit) };
    if (filters.next !== undefined && filters.next !== null) params['next'] = String(filters.next);
    if (filters.name) params['name'] = filters.name;

    return this.http.get<CompanyAdminListResponse>(`${constant.baseUrl}/super-admin/company-admin`, {
      params,
      headers: this.authHeaders(),
    });
  }

  createCompanyAdmin(body: CreateCompanyAdminBody): Observable<{ message?: string }> {
    return this.http.post<{ message?: string }>(`${constant.baseUrl}/super-admin/company-admin`, body, {
      headers: this.jsonAuthHeaders(),
    });
  }

  updateCompanyAdmin(id: number, body: UpdateCompanyAdminBody): Observable<{ message?: string }> {
    return this.http.put<{ message?: string }>(
      `${constant.baseUrl}/super-admin/company-admin/${id}`,
      body,
      { headers: this.jsonAuthHeaders() },
    );
  }
}
