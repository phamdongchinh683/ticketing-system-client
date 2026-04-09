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
  template: `
    <app-notification
      *ngIf="notification.show"
      [message]="notification.message"
      [type]="notification.type"
      (closed)="notification.show = false"
    ></app-notification>

    <div class="page">
      <div class="page-header">
        <h2>Companies</h2>

        <div class="toolbar">
          <input
            class="search-input"
            type="text"
            placeholder="Search by name..."
            [(ngModel)]="searchName"
            (ngModelChange)="onSearch()"
          />

          <select class="limit-select" [(ngModel)]="limit" (ngModelChange)="onLimitChange()">
            @for (l of pageLimits; track l) {
              <option [value]="l">{{ l }}</option>
            }
          </select>

          <button class="btn-add" (click)="openCreateModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Add
          </button>
        </div>
      </div>

      <div *ngIf="showModal" class="modal-overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <h3>{{ editingCompany ? 'Edit Company' : 'Add Bus Company' }}</h3>
          <div class="modal-body">
            <label>
              Name
              <input class="modal-input" [(ngModel)]="formName" placeholder="Company name" />
            </label>
            <label>
              Hotline
              <input class="modal-input" [(ngModel)]="formHotline" placeholder="e.g. 0987654321" />
            </label>
            <label>
              Logo URL
              <input class="modal-input" [(ngModel)]="formLogoUrl" placeholder="https://..." />
            </label>
          </div>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="closeModal()">Cancel</button>
            <button class="btn-submit" [disabled]="submitting" (click)="onSubmit()">
              {{ submitting ? 'Saving...' : (editingCompany ? 'Update' : 'Create') }}
            </button>
          </div>
        </div>
      </div>

      <!-- Delete Confirm -->
      <div *ngIf="showDeleteConfirm" class="modal-overlay" (click)="cancelDelete()">
        <div class="modal modal--sm" (click)="$event.stopPropagation()">
          <h3>Delete Company</h3>
          <p class="delete-msg">Are you sure you want to delete <strong>{{ deletingCompany?.name }}</strong>?</p>
          <div class="modal-footer">
            <button class="btn-cancel" (click)="cancelDelete()">Cancel</button>
            <button class="btn-danger" [disabled]="submitting" (click)="onConfirmDelete()">
              {{ submitting ? 'Deleting...' : 'Delete' }}
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading...</p>
      </div>

      <div *ngIf="!loading" class="page-body">
        <app-company-list
          [companies]="companies"
          (editCompany)="onEdit($event)"
          (deleteCompany)="onDelete($event)"
        ></app-company-list>

        <div class="pagination">
          <button
            class="btn-load-more"
            [disabled]="nextCursor === null"
            (click)="loadMore()"
          >
            {{ nextCursor !== null ? 'Next' : 'No more data' }}
          </button>
        </div>

        <div *ngIf="loadingMore" class="loading">
          <div class="spinner"></div>
          <p>Loading more...</p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .page {
        padding: 24px;
        max-width: 800px;
        margin: 0 auto;
      }
      .page-header { margin-bottom: 20px; }
      .page-header h2 {
        margin: 0 0 16px;
        font-size: 18px;
        font-weight: 600;
        color: var(--color-text-dark);
      }
      .toolbar { display: flex; gap: 10px; }
      .search-input {
        flex: 1;
        padding: 8px 14px;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        font-size: 13px;
        outline: none;
        background: var(--color-surface);
        color: var(--color-text-dark);
        transition: border-color 0.15s;
      }
      .search-input:focus { border-color: var(--color-primary); }
      .limit-select {
        padding: 8px 12px;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        font-size: 13px;
        background: var(--color-surface);
        color: var(--color-text-dark);
        cursor: pointer;
        outline: none;
      }
      .limit-select:focus { border-color: var(--color-primary); }
      .btn-add {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        background: var(--color-primary);
        color: white;
        border: none;
        border-radius: var(--radius-md);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.15s;
        white-space: nowrap;
      }
      .btn-add:hover { opacity: 0.9; }
      .btn-add svg { width: 16px; height: 16px; }

      /* Modal */
      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
      }
      .modal {
        width: 100%;
        max-width: 420px;
        background: var(--color-surface);
        border-radius: var(--radius-xl);
        padding: 24px;
        box-shadow: var(--shadow-md);
      }
      .modal--sm { max-width: 360px; }
      .modal h3 {
        margin: 0 0 20px;
        font-size: 16px;
        font-weight: 600;
        color: var(--color-text-dark);
      }
      .modal-body { display: flex; flex-direction: column; gap: 14px; }
      .modal-body label {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 12px;
        font-weight: 500;
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }
      .modal-input {
        padding: 10px 14px;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        font-size: 14px;
        outline: none;
        background: var(--color-surface);
        color: var(--color-text-dark);
        transition: border-color 0.15s;
      }
      .modal-input:focus { border-color: var(--color-primary); }
      .delete-msg {
        font-size: 14px;
        color: var(--color-text);
        line-height: 1.5;
      }
      .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
      .btn-cancel {
        padding: 8px 20px;
        background: none;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        color: var(--color-text-muted);
        font-size: 13px;
        cursor: pointer;
      }
      .btn-cancel:hover { background: var(--color-surface); }
      .btn-submit {
        padding: 8px 20px;
        background: var(--color-primary);
        border: none;
        border-radius: var(--radius-md);
        color: white;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
      }
      .btn-submit:hover { opacity: 0.9; }
      .btn-submit:disabled { opacity: 0.5; cursor: not-allowed; }
      .btn-danger {
        padding: 8px 20px;
        background: var(--color-red);
        border: none;
        border-radius: var(--radius-md);
        color: white;
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
      }
      .btn-danger:hover { opacity: 0.9; }
      .btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

      .page-body { display: flex; flex-direction: column; gap: 16px; }
      .loading {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        padding: 40px;
        color: var(--color-text);
      }
      .spinner {
        width: 28px;
        height: 28px;
        border: 3px solid var(--color-border);
        border-top-color: var(--color-primary);
        border-radius: 50%;
        animation: spin 0.7s linear infinite;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      .pagination { display: flex; justify-content: center; }
      .btn-load-more {
        padding: 8px 24px;
        background: var(--color-surface);
        color: var(--color-primary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        font-size: 13px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.15s;
      }
      .btn-load-more:hover {
        border-color: var(--color-primary);
        background: var(--color-primary-bg);
      }
      .btn-load-more:disabled { opacity: 0.5; cursor: not-allowed; }
      .btn-load-more:disabled:hover { border-color: var(--color-border); background: var(--color-surface); }
    `,
  ],
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
