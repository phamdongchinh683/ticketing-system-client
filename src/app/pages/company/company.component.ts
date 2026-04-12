import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { company } from '../../data/services/index';
import { Company } from '../../data/interfaces/company';
import { SharedModule } from '@app/shared/shared.module';
import { PAGE_LIMITS, DEFAULT_PAGE_LIMIT, type PageLimit } from '../../data/constants/index';
import { CompanyToolbarComponent } from './components/company-toolbar/company-toolbar.component';
import { CompanyFormModalComponent } from './components/company-form-modal/company-form-modal.component';
import { CompanyDeleteModalComponent } from './components/company-delete-modal/company-delete-modal.component';

@Component({
  selector: 'app-company',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SharedModule,
    CompanyToolbarComponent,
    CompanyFormModalComponent,
    CompanyDeleteModalComponent,
  ],
  templateUrl: './company.component.html',
  styleUrl: './company.component.css',
})
export class CompanyComponent implements OnInit {
  companies: Company[] = [];
  nextCursor: number | null = null;
  loading = true;
  loadingMore = false;

  searchName = '';
  limit: PageLimit = DEFAULT_PAGE_LIMIT;
  pageLimits = PAGE_LIMITS;

  showModal = false;
  editingCompany: Company | null = null;
  companyForm: FormGroup;
  submitting = false;

  showDeleteConfirm = false;
  deletingCompany: Company | null = null;

  notification: { show: boolean; message: string; type: 'success' | 'error' | 'warning' | 'info' } = {
    show: false,
    message: '',
    type: 'info',
  };

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly api: company.ApiService,
    private readonly fb: FormBuilder,
  ) {
    this.companyForm = this.fb.group({
      name: [''],
      hotline: [''],
      logoUrl: [''],
    });
  }

  ngOnInit() {
    this.fetch();
  }

  showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info') {
    this.notification = { show: true, message, type };
  }

  onSearchInput(value: string) {
    this.searchName = value;
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.fetch(), 300);
  }

  onLimitChange(value: PageLimit) {
    this.limit = value;
    this.fetch();
  }

  private fetch() {
    this.loading = true;
    this.companies = [];
    this.nextCursor = null;

    this.api.getCompanies(this.limit, undefined, this.searchName || undefined).subscribe({
      next: (res) => {
        this.companies = res.companies;
        this.nextCursor = res.next;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  loadMore() {
    if (this.nextCursor === null || this.loadingMore) return;
    this.loadingMore = true;

    this.api.getCompanies(this.limit, this.nextCursor, this.searchName || undefined).subscribe({
      next: (res) => {
        this.companies = [...this.companies, ...res.companies];
        this.nextCursor = res.next;
        this.loadingMore = false;
      },
      error: () => {
        this.loadingMore = false;
      },
    });
  }

  openCreateModal() {
    this.editingCompany = null;
    this.companyForm.reset({ name: '', hotline: '', logoUrl: '' });
    this.showModal = true;
  }

  onEdit(c: Company) {
    this.editingCompany = c;
    this.companyForm.patchValue({
      name: c.name,
      hotline: c.hotline,
      logoUrl: c.logoUrl,
    });
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingCompany = null;
  }

  private readonly NAME_REGEX = /^[a-zA-ZÀ-ỹ\s]{5,}$/;

  onSubmit() {
    const { name: rawName, hotline: rawHotline, logoUrl: rawLogo } = this.companyForm.getRawValue();
    const name = (rawName ?? '').trim();
    const hotline = (rawHotline ?? '').trim();
    const logoUrl = (rawLogo ?? '').trim();

    if (!name) {
      this.showNotification('Name is required.', 'warning');
      return;
    }
    if (!this.NAME_REGEX.test(name)) {
      this.showNotification('Name must be at least 5 characters, letters only.', 'warning');
      return;
    }
    if (hotline && (hotline.length < 10 || !/^\d+$/.test(hotline))) {
      this.showNotification('Hotline must be at least 10 digits.', 'warning');
      return;
    }

    this.submitting = true;

    if (this.editingCompany) {
      const data: Record<string, string> = {};
      if (name !== this.editingCompany.name) data['name'] = name;
      if (hotline !== this.editingCompany.hotline) data['hotline'] = hotline;
      if (logoUrl !== this.editingCompany.logoUrl) data['logoUrl'] = logoUrl;

      this.api.updateCompany(this.editingCompany.id, data).subscribe({
        next: (res) => {
          this.companies = this.companies.map((c) => (c.id === res.company.id ? res.company : c));
          this.showNotification('Company updated!', 'success');
          this.closeModal();
          this.submitting = false;
        },
        error: (err) => {
          this.showNotification(err.error?.message || 'Failed to update.', 'error');
          this.submitting = false;
        },
      });
    } else {
      this.api.createCompany(name, hotline, logoUrl).subscribe({
        next: (res) => {
          this.companies = [res.company, ...this.companies];
          this.showNotification('Company created!', 'success');
          this.closeModal();
          this.submitting = false;
        },
        error: (err) => {
          this.showNotification(err.error?.message || 'Failed to create.', 'error');
          this.submitting = false;
        },
      });
    }
  }

  onDelete(c: Company) {
    this.deletingCompany = c;
    this.showDeleteConfirm = true;
  }

  cancelDelete() {
    this.showDeleteConfirm = false;
    this.deletingCompany = null;
  }

  onConfirmDelete() {
    if (!this.deletingCompany) return;
    this.submitting = true;

    this.api.deleteCompany(this.deletingCompany.id).subscribe({
      next: () => {
        const deleteId = this.deletingCompany?.id;
        if (deleteId !== undefined) {
          this.companies = this.companies.filter((c) => c.id !== deleteId);
        }
        this.showNotification('Company deleted!', 'success');
        this.cancelDelete();
        this.submitting = false;
      },
      error: (err) => {
        this.showNotification(err.error?.message || 'Failed to delete.', 'error');
        this.submitting = false;
      },
    });
  }
}
