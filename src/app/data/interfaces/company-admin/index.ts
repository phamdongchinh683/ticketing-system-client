export type CompanyAdminStatus = 'active' | 'inactive' | 'banned';

export interface CompanyAdmin {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  status: CompanyAdminStatus;
  companyId?: number;
}

export interface CompanyAdminListResponse {
  /** Raw API rows; may include nested `contactInfo` */
  companyAdmins?: unknown[];
  admins?: unknown[];
  next: number | null;
}

export interface CreateCompanyAdminBody {
  username: string;
  fullName: string;
  contactInfo: { email: string; phone: string };
  password: string;
  companyId: number;
}

export interface UpdateCompanyAdminBody {
  fullName: string;
  email: string;
  phone: string;
  status: CompanyAdminStatus;
}

export const COMPANY_ADMIN_STATUSES: CompanyAdminStatus[] = ['active', 'inactive', 'banned'];
