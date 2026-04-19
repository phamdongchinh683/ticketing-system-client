import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { FxRatesLatestResponse } from '../../interfaces/fx-rates';

const FX_RATES_LATEST = 'https://api.fxratesapi.com/latest';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  getUsdVndRate(): Observable<number> {
    return this.http.get<FxRatesLatestResponse>(FX_RATES_LATEST).pipe(
      map((res) => {
        const vnd = res.rates?.['VND'];
        if (typeof vnd !== 'number' || !Number.isFinite(vnd) || vnd <= 0) {
          throw new Error('Invalid VND rate');
        }
        return vnd;
      }),
    );
  }
}
