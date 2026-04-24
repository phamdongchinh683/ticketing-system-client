import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap, timeout } from 'rxjs/operators';

interface VnDistrict {
  code: number;
  name: string;
}

interface VnProvince {
  code: number;
  name: string;
}

interface VnProvinceDetail {
  code: number;
  name: string;
  districts: VnDistrict[];
}

interface NominatimReverseResponse {
  display_name: string;
  lat: string;
  lon: string;
}

interface NominatimSearchResponse {
  display_name: string;
  lat: string;
  lon: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private provinces$: Observable<VnProvince[]> | null = null;
  private readonly districtByProvinceCache = new Map<number, VnDistrict[]>();
  private readonly districtRequestByProvince = new Map<number, Observable<VnDistrict[]>>();
  private readonly reverseGeoCache = new Map<string, ReverseGeocodeResult>();
  private readonly searchGeoCache = new Map<string, GeocodeResult | null>();
  private readonly searchGeoRequestCache = new Map<string, Observable<GeocodeResult | null>>();

  constructor(private readonly http: HttpClient) {}

  getProvinces(): Observable<VnProvince[]> {
    if (!this.provinces$) {
      this.provinces$ = this.http.get<VnProvince[]>('https://provinces.open-api.vn/api/p/').pipe(shareReplay(1));
    }
    return this.provinces$;
  }

  getDistrictsByProvince(provinceCode: number): Observable<VnDistrict[]> {
    const cached = this.districtByProvinceCache.get(provinceCode);
    if (cached) return of(cached);

    const inFlight = this.districtRequestByProvince.get(provinceCode);
    if (inFlight) return inFlight;

    const request$ = this.http
      .get<VnProvinceDetail>(`https://provinces.open-api.vn/api/p/${provinceCode}?depth=2`)
      .pipe(
        map((res) => res.districts ?? []),
        tap((districts) => this.districtByProvinceCache.set(provinceCode, districts)),
        shareReplay(1),
      );

    this.districtRequestByProvince.set(provinceCode, request$);
    return request$;
  }

  reverseGeocode(latitude: number, longitude: number): Observable<ReverseGeocodeResult> {
    const key = `${latitude.toFixed(6)},${longitude.toFixed(6)}`;
    const cached = this.reverseGeoCache.get(key);
    if (cached) return of(cached);

    return this.http
      .get<NominatimReverseResponse>('https://nominatim.openstreetmap.org/reverse', {
        params: {
          format: 'jsonv2',
          lat: String(latitude),
          lon: String(longitude),
          addressdetails: '1',
          'accept-language': 'vi',
        },
      })
      .pipe(
        map((res) => ({
          fullAddress: res.display_name ?? '',
          latitude: Number(res.lat),
          longitude: Number(res.lon),
        })),
        tap((res) => this.reverseGeoCache.set(key, res)),
      );
  }

  geocodeAddress(query: string): Observable<GeocodeResult | null> {
    const normalized = query.replace(/\s+/g, ' ').trim();
    if (!normalized) return of(null);

    const key = normalized.toLowerCase();
    if (this.searchGeoCache.has(key)) return of(this.searchGeoCache.get(key) ?? null);
    const inFlight = this.searchGeoRequestCache.get(key);
    if (inFlight) return inFlight;

    const request$ = this.http
      .get<NominatimSearchResponse[]>('https://nominatim.openstreetmap.org/search', {
        params: {
          format: 'jsonv2',
          q: normalized,
          limit: '1',
          addressdetails: '1',
          'accept-language': 'vi',
          countrycodes: 'vn',
        },
      })
      .pipe(
        timeout(2500),
        map((items) => {
          const first = items?.[0];
          if (!first) return null;
          return {
            fullAddress: first.display_name ?? normalized,
            latitude: Number(first.lat),
            longitude: Number(first.lon),
          };
        }),
        catchError(() => of(null)),
        tap((res) => this.searchGeoCache.set(key, res)),
        finalize(() => this.searchGeoRequestCache.delete(key)),
        shareReplay(1),
      );
    this.searchGeoRequestCache.set(key, request$);
    return request$;
  }
}

export type { VnProvince, VnDistrict };
export type { ReverseGeocodeResult };
export type { GeocodeResult };

interface ReverseGeocodeResult {
  fullAddress: string;
  latitude: number;
  longitude: number;
}

interface GeocodeResult {
  fullAddress: string;
  latitude: number;
  longitude: number;
}
