export interface Company {
  id: number;
  name: string;
  hotline: string;
  logoUrl: string;
  address: string;
  latitude?: number;
  longitude?: number;
}

export interface CompanyListResponse {
  companies: Company[];
  next: number | null;
}

export interface CreateCompanyResponse {
  company: Company;
}
