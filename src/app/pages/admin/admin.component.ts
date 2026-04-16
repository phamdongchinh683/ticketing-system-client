import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '@app/shared/shared.module';
import { companyAdmin, publicApi } from '../../data/services';
import { Company } from '../../data/interfaces/company';
import { CompanyAdmin, CreateCompanyAdminBody, UpdateCompanyAdminBody } from '../../data/interfaces/company-admin';
import { normalizeCompanyAdminList } from './utils/company-admin.mapper';
import { DEFAULT_PAGE_LIMIT, PAGE_LIMITS, type PageLimit } from '../../data/constants';
import { CompanyAdminToolbarComponent } from './components/company-admin-toolbar/company-admin-toolbar.component';
import { CompanyAdminTableComponent } from './components/company-admin-table/company-admin-table.component';
import { CompanyAdminCreateModalComponent } from './components/company-admin-create-modal/company-admin-create-modal.component';
import { CompanyAdminEditModalComponent } from './components/company-admin-edit-modal/company-admin-edit-modal.component';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [
    CommonModule,
    SharedModule,
    CompanyAdminToolbarComponent,
    CompanyAdminTableComponent,
    CompanyAdminCreateModalComponent,
    CompanyAdminEditModalComponent,
  ],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css'],
})
export class AdminComponent implements OnInit {
  limit: PageLimit = DEFAULT_PAGE_LIMIT;
  pageLimits = PAGE_LIMITS;

  admins: CompanyAdmin[] = [];
  companies: Company[] = [];
  nextCursor: number | null = null;
  loading = false;
  loadingMore = false;

  showCreate = false;
  createSubmitting = false;

  showEdit = false;
  editingAdmin: CompanyAdmin | null = null;
  editSubmitting = false;

  notification: { show: boolean; message: string; type: 'success' | 'error' | 'warning' | 'info' } = {
    show: false,
    message: '',
    type: 'info',
  };

  constructor(
    private readonly api: companyAdmin.ApiService,
    private readonly publicCompanies: publicApi.ApiService,
  ) {}

  ngOnInit(): void {
    this.loadCompaniesForSelect();
    this.fetch();
  }

  showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info') {
    this.notification = { show: true, message, type };
  }

  onLimitChange(value: PageLimit) {
    this.limit = value;
    this.fetch();
  }

  openCreate() {
    this.showCreate = true;
  }

  onCreateOpenChange(open: boolean) {
    this.showCreate = open;
    if (!open) this.createSubmitting = false;
  }

  onCreateValidateFailed(msg: string) {
    this.showNotification(msg, 'warning');
  }

  onCreateSubmit(body: CreateCompanyAdminBody) {
    this.createSubmitting = true;
    this.api.createCompanyAdmin(body).subscribe({
      next: (res) => {
        this.showNotification('Thành công.', 'success');
        this.showCreate = false;
        this.createSubmitting = false;
        this.fetch();
      },
      error: (err: unknown) => {
        const e = err as { error?: { message?: string } };
        this.showNotification(e.error?.message || 'Thất bại.', 'error');
        this.createSubmitting = false;
      },
    });
  }

  onUpdateClick(admin: CompanyAdmin) {
    this.editingAdmin = admin;
    this.showEdit = true;
  }

  onEditOpenChange(open: boolean) {
    this.showEdit = open;
    if (!open) {
      this.editSubmitting = false;
      this.editingAdmin = null;
    }
  }

  onEditSubmit(body: UpdateCompanyAdminBody) {
    const target = this.editingAdmin;
    if (!target) return;
    const id = target.id;
    this.editSubmitting = true;
    this.api.updateCompanyAdmin(id, body).subscribe({
      next: (res) => {
        this.showNotification('Thành công.', 'success');
        this.admins = this.admins.map((a) =>
          a.id === id ? { ...a, fullName: body.fullName, email: body.email, phone: body.phone, status: body.status } : a,
        );
        this.showEdit = false;
        this.editingAdmin = null;
        this.editSubmitting = false;
      },
      error: (err: unknown) => {
        const e = err as { error?: { message?: string } };
        this.showNotification(e.error?.message || 'Thất bại.', 'error');
        this.editSubmitting = false;
      },
    });
  }

  loadMore() {
    if (this.nextCursor === null || this.loadingMore) return;
    this.loadingMore = true;
    this.api
      .getCompanyAdmins({
        limit: this.limit,
        next: this.nextCursor,
      })
      .subscribe({
        next: (res) => {
          const batch = normalizeCompanyAdminList(res);
          this.admins = [...this.admins, ...batch];
          this.nextCursor = res.next ?? null;
          this.loadingMore = false;
        },
        error: (err: unknown) => {
          const e = err as { error?: { message?: string } };
          this.showNotification(e.error?.message || 'Tải thêm thất bại.', 'error');
          this.loadingMore = false;
        },
      });
  }

  private fetch() {
    this.loading = true;
    this.admins = [];
    this.nextCursor = null;
    this.api
      .getCompanyAdmins({
        limit: this.limit,
      })
      .subscribe({
        next: (res) => {
          this.admins = normalizeCompanyAdminList(res);
          this.nextCursor = res.next ?? null;
          this.loading = false;
        },
        error: (err: unknown) => {
          const e = err as { error?: { message?: string } };
          this.showNotification(e.error?.message || 'Tải danh sách tài khoản công ty thất bại.', 'error');
          this.loading = false;
        },
      });
  }

  private loadCompaniesForSelect() {
    this.publicCompanies.getCompanies(100).subscribe({
      next: (r) => {
        this.companies = r.companies ?? [];
      },
      error: () => {
        this.companies = [];
      },
    });
  }

}
