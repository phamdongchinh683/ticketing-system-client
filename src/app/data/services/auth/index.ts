import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { constant } from '../../constants';
import { AuthResponse } from '../../interfaces/auth';
import { isDigitsOnly } from '@app/shared/utils/validators';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  signIn(input: string, password: string): Observable<AuthResponse> {
    const body: Record<string, string> = { password };

    if (isDigitsOnly(input)) {
      body['phone'] = input;
    } else if (input.includes('@')) {
      body['email'] = input;
    } else {
      body['username'] = input;
    }

    return this.http.post<AuthResponse>(`${constant.baseUrl}/auth/sign-in`, body);
  }
}
