import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { company } from '../../data/services/index';
import { Company } from '../../data/interfaces/company';
import { SharedModule } from '../../../shared/shared.module';
import { PAGE_LIMITS, DEFAULT_PAGE_LIMIT } from '../../data/constants/index';

@Component({
  selector: 'app-company',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule],
  templateUrl: './company.component.html',
  styleUrl: './company.component.css',
})
export class CompanyComponent implements OnInit {
  companies: Company[] = [];
  nextCursor: number | null = null;
  loading = true;
  loadingMore = false;

  searchName = '';
  limit: number = DEFAULT_PAGE_LIMIT;
  pageLimits = PAGE_LIMITS;

  showModal = false;
  editingCompany: Company | null = null;
  formName = '';
  formHotline = '';
  formLogoUrl = '';
  submitting = false;

  showDeleteConfirm = false;
  deletingCompany: Company | null = null;

  notification: { show: boolean; message: string; type: 'success' | 'error' | 'warning' | 'info' } = {
    show: false,
    message: '',
    type: 'info',
  };

  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly api: company.ApiService) {}

  ngOnInit() {
    this.fetch();
  }

  showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info') {
    this.notification = { show: true, message, type };
  }

  onSearch() {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => this.fetch(), 300);
  }

  onLimitChange() {
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
    if (this.nextCursor === null) return;
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
    this.formName = '';
    this.formHotline = '';
    this.formLogoUrl = '';
    this.showModal = true;
  }

  onEdit(c: Company) {
    this.editingCompany = c;
    this.formName = c.name;
    this.formHotline = c.hotline;
    this.formLogoUrl = c.logoUrl;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.editingCompany = null;
  }

  private readonly NAME_REGEX = /^[a-zA-ZÀ-ỹ\s]{5,}$/;

  onSubmit() {
    const name = this.formName.trim();
    const hotline = this.formHotline.trim();

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
      if (this.formName.trim() !== this.editingCompany.name) data['name'] = this.formName.trim();
      if (this.formHotline.trim() !== this.editingCompany.hotline) data['hotline'] = this.formHotline.trim();
      if (this.formLogoUrl.trim() !== this.editingCompany.logoUrl) data['logoUrl'] = this.formLogoUrl.trim();

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
      this.api.createCompany(this.formName.trim(), this.formHotline.trim(), this.formLogoUrl.trim()).subscribe({
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
        this.companies = this.companies.filter((c) => c.id !== deleteId);
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
