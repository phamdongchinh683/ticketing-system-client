import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { publicApi, user } from '../../data/services';
import { Company } from '../../data/interfaces/company';
import {
  CreateUserResponse,
  DeleteUserResponse,
  UpdateUserPasswordResponse,
  UpdateUserResponse,
  User,
  UserListResponse,
  USER_ROLES,
  USER_STATUSES,
} from '../../data/interfaces/user';
import { CompanyListResponse } from '../../data/interfaces/company';
import { DEFAULT_PAGE_LIMIT, PAGE_LIMITS } from '../../data/constants';
import { emailValidator, isValidPassword, PASSWORD_MESSAGE, phone10DigitsValidator } from '../../../shared/utils/validators';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule],
  template: `
    <app-notification
      *ngIf="notification.show"
      [message]="notification.message"
      [type]="notification.type"
      (closed)="notification.show = false"
    ></app-notification>

    <div class="page">
      <div class="page-header">
        <div class="header-row">
          <h2>Users</h2>
          <button class="btn-create" type="button" (click)="openCreateModal()">Create User</button>
        </div>

        <form class="filters" [formGroup]="filters" (ngSubmit)="applyFilters()">
          <div class="row">

            <label class="field">
              <span class="label">Email</span>
              <input class="input" formControlName="email" placeholder="user@example.com" />
              <span class="error" *ngIf="filters.controls.email.touched && filters.controls.email.errors?.['email']">
                Invalid email
              </span>
            </label>

            <label class="field">
              <span class="label">Phone</span>
              <input class="input" formControlName="phone" placeholder="eg. 0987654321" />
              <span
                class="error"
                *ngIf="filters.controls.phone.touched && filters.controls.phone.errors?.['phone10Digits']"
              >
                Phone must be exactly 10 digits
              </span>
            </label>

            <label class="field">
              <span class="label">Company</span>
              <input
                class="input"
                formControlName="companyName"
                placeholder="Search company by name..."
                (focus)="companyDropdownOpen = true"
              />
              <div class="dropdown" *ngIf="companyDropdownOpen" (scroll)="onCompanyDropdownScroll($event)">
                <button class="dropdown-item" type="button" (click)="selectCompany(null)">
                  <span class="company-name">All companies</span>
                  <span class="company-hotline">No company filter</span>
                </button>

                <div class="dropdown-loading" *ngIf="companiesLoading">Loading companies...</div>

                @for (c of companies; track c.id) {
                  <button class="dropdown-item" type="button" (click)="selectCompany(c)">
                    <span class="company-name">{{ c.name }}</span>
                    <span class="company-hotline">{{ c.hotline }}</span>
                  </button>
                }

                <div class="dropdown-empty" *ngIf="!companiesLoading && companies.length === 0">No companies</div>
                <div class="dropdown-loading" *ngIf="companiesLoadingMore">Loading more...</div>
              </div>
              <div class="hint" *ngIf="selectedCompany">
                Selected: <strong>{{ selectedCompany.name }}</strong>
                <button class="btn-link" type="button" (click)="selectCompany(null)">clear</button>
              </div>
            </label>
          </div>

          <div class="row">
            <label class="field">
              <span class="label">Status</span>
              <select class="select" formControlName="status">
                <option [ngValue]="null">Select status</option>
                @for (s of statuses; track s) {
                  <option [value]="s">{{ s }}</option>
                }
              </select>
            </label>

            <label class="field">
              <span class="label">Role</span>
              <select class="select" formControlName="role">
                <option [ngValue]="null">Select role</option>
                @for (r of roles; track r) {
                  <option [value]="r">{{ r }}</option>
                }
              </select>
            </label>

            <label class="field">
              <span class="label">Limit</span>
              <select class="select" formControlName="limit">
                @for (l of pageLimits; track l) {
                  <option [value]="l">{{ l }}</option>
                }
              </select>
            </label>
          </div>

          <div class="actions">
            <button class="btn" type="submit" [disabled]="loading">Search</button>
            <button class="btn btn--ghost" type="button" (click)="reset()">Reset</button>
          </div>
        </form>
      </div>

      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>Loading users...</p>
      </div>

      <div *ngIf="!loading" class="page-body">
        <div class="summary">
          <span>{{ users.length }} user(s)</span>
        </div>

        <div class="table-wrap" *ngIf="users.length > 0; else emptyState">
          <table class="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Full name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Status</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (u of users; track u.id) {
                <tr>
                  <td>{{ u.id }}</td>
                  <td>{{ u.username }}</td>
                  <td>{{ u.fullName }}</td>
                  <td>{{ u.email }}</td>
                  <td>{{ u.phone }}</td>
                  <td><span class="pill" [class]="'pill--' + u.status">{{ u.status }}</span></td>
                  <td><span class="pill pill--neutral">{{ u.role }}</span></td>
                  <td>
                    <div class="row-actions">
                      <button class="btn-row btn-row--edit" type="button" (click)="openEditModal(u)">Edit</button>
                      <button class="btn-row btn-row--password" type="button" (click)="openPasswordModal(u)">
                        Password
                      </button>
                      <button class="btn-row btn-row--delete" type="button" (click)="openDeleteModal(u)">Delete</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <ng-template #emptyState>
          <div class="empty">
            <h3>No users</h3>
            <p>Currently, there are no users in the system.</p>
          </div>
        </ng-template>

        <div class="pagination">
          <button class="btn-load-more" [disabled]="nextCursor === null || loadingMore" (click)="loadMore()">
            {{ nextCursor !== null ? (loadingMore ? 'Loading...' : 'Next') : 'No more data' }}
          </button>
        </div>
      </div>
    </div>

    <div *ngIf="showCreateModal" class="modal-overlay" (click)="closeCreateModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <h3>Create User</h3>
        <form class="modal-form" [formGroup]="createForm" (ngSubmit)="submitCreateUser()">
          <label class="field">
            <span class="label">Username</span>
            <input class="input" formControlName="username" placeholder="username" />
          </label>

          <label class="field">
            <span class="label">Full Name</span>
            <input class="input" formControlName="fullName" placeholder="min 7 characters" />
          </label>

          <label class="field">
            <span class="label">Email</span>
            <input class="input" formControlName="email" placeholder="user@example.com" />
          </label>

          <label class="field">
            <span class="label">Phone</span>
            <input class="input" formControlName="phone" placeholder="eg. 0987654321" />
          </label>

          <label class="field">
            <span class="label">Password</span>
            <div class="password-wrap">
              <input
                class="input password-input"
                [type]="showCreatePassword ? 'text' : 'password'"
                formControlName="password"
                placeholder="Abcd12345#"
              />
              <button
                class="btn-password-toggle"
                type="button"
                (click)="toggleCreatePassword()"
                [attr.aria-label]="showCreatePassword ? 'Hide password' : 'Show password'"
                [title]="showCreatePassword ? 'Hide password' : 'Show password'"
              >
                <svg *ngIf="!showCreatePassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <svg *ngIf="showCreatePassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C5 19 1 12 1 12a21.82 21.82 0 0 1 5.06-6.94" />
                  <path d="M9.9 4.24A10.95 10.95 0 0 1 12 5c7 0 11 7 11 7a21.86 21.86 0 0 1-3.22 4.74" />
                  <path d="M1 1l22 22" />
                </svg>
              </button>
            </div>
          </label>

          <label class="field">
            <span class="label">Status</span>
            <select class="select" formControlName="status">
              @for (s of statuses; track s) {
                <option [value]="s">{{ s }}</option>
              }
            </select>
          </label>

          <label class="field">
            <span class="label">Role</span>
            <select class="select" formControlName="role">
              @for (r of roles; track r) {
                <option [value]="r">{{ r }}</option>
              }
            </select>
          </label>

          <div class="modal-actions">
            <button class="btn btn--ghost" type="button" (click)="closeCreateModal()">Cancel</button>
            <button class="btn" type="submit" [disabled]="creatingUser">
              {{ creatingUser ? 'Creating...' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div *ngIf="showEditModal" class="modal-overlay" (click)="closeEditModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <h3>Edit User</h3>
        <form class="modal-form" [formGroup]="editForm" (ngSubmit)="submitEditUser()">
          <label class="field">
            <span class="label">Username</span>
            <input class="input" formControlName="username" />
          </label>
          <label class="field">
            <span class="label">Full Name</span>
            <input class="input" formControlName="fullName" />
          </label>
          <label class="field">
            <span class="label">Email</span>
            <input class="input" formControlName="email" />
          </label>
          <label class="field">
            <span class="label">Phone</span>
            <input class="input" formControlName="phone" />
          </label>
          <label class="field">
            <span class="label">Status</span>
            <select class="select" formControlName="status">
              @for (s of statuses; track s) {
                <option [value]="s">{{ s }}</option>
              }
            </select>
          </label>
          <label class="field">
            <span class="label">Role</span>
            <select class="select" formControlName="role">
              @for (r of roles; track r) {
                <option [value]="r">{{ r }}</option>
              }
            </select>
          </label>
          <div class="modal-actions">
            <button class="btn btn--ghost" type="button" (click)="closeEditModal()">Cancel</button>
            <button class="btn" type="submit" [disabled]="editingUserLoading">
              {{ editingUserLoading ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div *ngIf="showPasswordModal" class="modal-overlay" (click)="closePasswordModal()">
      <div class="modal" (click)="$event.stopPropagation()">
        <h3>Update Password</h3>
        <form class="modal-form modal-form--single" [formGroup]="passwordForm" (ngSubmit)="submitUpdatePassword()">
          <label class="field">
            <span class="label">New Password</span>
            <div class="password-wrap">
              <input
                class="input password-input"
                [type]="showUpdatePassword ? 'text' : 'password'"
                formControlName="password"
                placeholder="Abcd12345#"
              />
              <button class="btn-password-toggle" type="button" (click)="toggleUpdatePassword()">
                <svg *ngIf="!showUpdatePassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <svg *ngIf="showUpdatePassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19C5 19 1 12 1 12a21.82 21.82 0 0 1 5.06-6.94" />
                  <path d="M9.9 4.24A10.95 10.95 0 0 1 12 5c7 0 11 7 11 7a21.86 21.86 0 0 1-3.22 4.74" />
                  <path d="M1 1l22 22" />
                </svg>
              </button>
            </div>
          </label>
          <div class="modal-actions">
            <button class="btn btn--ghost" type="button" (click)="closePasswordModal()">Cancel</button>
            <button class="btn" type="submit" [disabled]="updatingPasswordLoading">
              {{ updatingPasswordLoading ? 'Updating...' : 'Update Password' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <div *ngIf="showDeleteModal" class="modal-overlay" (click)="closeDeleteModal()">
      <div class="modal modal--sm" (click)="$event.stopPropagation()">
        <h3>Delete User</h3>
        <p>Are you sure you want to delete <strong>{{ selectedActionUser?.username }}</strong>?</p>
        <div class="modal-actions">
          <button class="btn btn--ghost" type="button" (click)="closeDeleteModal()">Cancel</button>
          <button class="btn btn--danger" type="button" [disabled]="deletingUserLoading" (click)="submitDeleteUser()">
            {{ deletingUserLoading ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .page {
        padding: 24px;
        max-width: 1100px;
        margin: 0 auto;
      }
      .page-header h2 {
        margin: 0 0 16px;
        font-size: 18px;
        font-weight: 600;
        color: var(--color-text-dark);
      }
      .header-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
      }
      .btn-create {
        padding: 10px 16px;
        border: none;
        border-radius: var(--radius-md);
        background: var(--color-primary);
        color: white;
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      }
      .btn-create:hover {
        opacity: 0.9;
      }

      .filters {
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-xl);
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        box-shadow: var(--shadow-sm);
      }
      .row {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }
      @media (max-width: 980px) {
        .row {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (max-width: 520px) {
        .row {
          grid-template-columns: 1fr;
        }
      }

      .field {
        display: flex;
        flex-direction: column;
        gap: 6px;
        position: relative;
        min-width: 0;
      }
      .label {
        font-size: 11px;
        font-weight: 600;
        text-align: left;
        color: var(--color-text-muted);
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }
      .input,
      .select {
        padding: 10px 12px;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        font-size: 13px;
        outline: none;
        background: var(--color-surface);
        color: var(--color-text-dark);
      }
      .password-wrap {
        position: relative;
      }
      .password-input {
        padding-right: 44px;
      }
      .btn-password-toggle {
        position: absolute;
        right: 6px;
        top: 50%;
        transform: translateY(-50%);
        border: none;
        background: none;
        color: var(--color-text-muted);
        cursor: pointer;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .btn-password-toggle svg {
        width: 16px;
        height: 16px;
      }
      .btn-password-toggle:hover {
        background: var(--color-primary-bg);
        color: var(--color-primary);
      }
      .input:focus,
      .select:focus {
        border-color: var(--color-primary);
      }
      .error {
        font-size: 12px;
        color: var(--color-red);
      }
      .hint {
        font-size: 12px;
        color: var(--color-text-muted);
        display: flex;
        align-items: center;
        gap: 4px;
        margin-top: 2px;
      }
      .btn-link {
        background: none;
        border: none;
        color: var(--color-primary);
        cursor: pointer;
        padding: 0;
        margin-left: 6px;
      }

      .dropdown {
        position: absolute;
        top: calc(100% + 6px);
        left: 0;
        right: 0;
        background: var(--color-surface);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-md);
        overflow: hidden;
        z-index: 50;
        max-height: 260px;
        overflow-y: auto;
        overscroll-behavior: contain;
      }
      .dropdown-item {
        width: 100%;
        text-align: left;
        padding: 10px 12px;
        border: none;
        background: none;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        gap: 10px;
        color: var(--color-text-dark);
      }
      .dropdown-item:hover {
        background: var(--color-primary-bg);
      }
      .company-name {
        font-weight: 600;
      }
      .company-hotline {
        color: var(--color-text-muted);
        font-size: 12px;
        white-space: nowrap;
      }
      .dropdown-loading,
      .dropdown-empty {
        padding: 10px 12px;
        color: var(--color-text-muted);
        font-size: 12px;
      }

      .actions {
        display: flex;
        gap: 10px;
        justify-content: flex-end;
      }
      .btn {
        padding: 10px 16px;
        background: var(--color-primary);
        color: white;
        border: none;
        border-radius: var(--radius-md);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
      }
      .btn:hover {
        opacity: 0.9;
      }
      .btn:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }
      .btn--ghost {
        background: none;
        border: 1px solid var(--color-border);
        color: var(--color-text-muted);
      }

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
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .page-body {
        margin-top: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .summary {
        display: flex;
        gap: 10px;
        align-items: center;
        color: var(--color-text-dark);
        font-size: 13px;
      }
      .muted {
        color: var(--color-text-muted);
      }

      .table-wrap {
        border: 1px solid var(--color-border);
        border-radius: var(--radius-xl);
        background: var(--color-surface);
        overflow: auto;
      }
      .table {
        width: 100%;
        border-collapse: collapse;
        min-width: 900px;
      }
      th,
      td {
        padding: 12px 14px;
        text-align: center;
        border-bottom: 1px solid var(--color-border);
        font-size: 13px;
        color: var(--color-text-dark);
      }
      th {
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        color: var(--color-text-muted);
        background: var(--color-surface);
        position: sticky;
        top: 0;
        z-index: 1;
      }
      tr:hover td {
        background: rgba(99, 102, 241, 0.04);
      }

      .pill {
        display: inline-flex;
        align-items: center;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 12px;
        font-weight: 600;
        text-transform: capitalize;
      }
      .pill--active {
        background: rgba(16, 185, 129, 0.12);
        color: #059669;
      }
      .pill--inactive {
        background: rgba(245, 158, 11, 0.12);
        color: #b45309;
      }
      .pill--banned {
        background: rgba(239, 68, 68, 0.12);
        color: #dc2626;
      }
      .pill--neutral {
        background: rgba(99, 102, 241, 0.12);
        color: #4f46e5;
      }

      .empty {
        padding: 28px;
        border: 1px dashed var(--color-border);
        border-radius: var(--radius-xl);
        background: var(--color-surface);
        color: var(--color-text);
      }
      .empty h3 {
        margin: 0 0 6px;
        color: var(--color-text-dark);
      }
      .empty p {
        margin: 0;
        color: var(--color-text-muted);
      }

      .pagination {
        display: flex;
        justify-content: center;
      }
      .btn-load-more {
        padding: 10px 24px;
        background: var(--color-surface);
        color: var(--color-primary);
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        font-size: 13px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s;
      }
      .btn-load-more:hover {
        border-color: var(--color-primary);
        background: var(--color-primary-bg);
      }
      .btn-load-more:disabled {
        opacity: 0.55;
        cursor: not-allowed;
      }

      .modal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.45);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1200;
      }
      .modal {
        width: 100%;
        max-width: 520px;
        background: var(--color-surface);
        border-radius: var(--radius-xl);
        padding: 20px;
        border: 1px solid var(--color-border);
        box-shadow: var(--shadow-md);
      }
      .modal h3 {
        margin: 0 0 14px;
        font-size: 16px;
        color: var(--color-text-dark);
      }
      .modal-form {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }
      .modal-form--single {
        grid-template-columns: 1fr;
      }
      .modal--sm {
        max-width: 420px;
      }
      .row-actions {
        display: flex;
        gap: 6px;
      }
      .btn-row {
        padding: 6px 8px;
        border-radius: var(--radius-sm);
        border: 1px solid var(--color-border);
        background: var(--color-surface);
        font-size: 12px;
        cursor: pointer;
      }
      .btn-row--edit {
        color: var(--color-primary);
      }
      .btn-row--password {
        color: #0f766e;
      }
      .btn-row--delete {
        color: var(--color-red);
      }
      .modal-actions {
        grid-column: 1 / -1;
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        margin-top: 4px;
      }
      .btn--danger {
        background: var(--color-red);
      }
    `,
  ],
})
export class UserComponent implements OnInit, OnDestroy {
  statuses = USER_STATUSES;
  roles = USER_ROLES;
  pageLimits = PAGE_LIMITS;

  companies: Company[] = [];
  companiesLoading = false;
  companiesLoadingMore = false;
  companyDropdownOpen = false;
  selectedCompany: Company | null = null;
  private companyNextCursor: number | null = null;
  private companySearchTerm = '';
  private readonly COMPANY_PAGE_LIMIT = 10;

  users: User[] = [];
  nextCursor: number | null = null;

  loading = false;
  loadingMore = false;
  creatingUser = false;
  showCreateModal = false;
  showCreatePassword = false;
  showEditModal = false;
  showPasswordModal = false;
  showDeleteModal = false;
  showUpdatePassword = false;
  editingUserLoading = false;
  updatingPasswordLoading = false;
  deletingUserLoading = false;
  selectedActionUser: User | null = null;

  notification: { show: boolean; message: string; type: 'success' | 'error' | 'warning' | 'info' } = {
    show: false,
    message: '',
    type: 'info',
  };

  filters!: FormGroup<{
    email: FormControl<string | null>;
    phone: FormControl<string | null>;
    status: FormControl<null | (typeof USER_STATUSES)[number]>;
    role: FormControl<null | (typeof USER_ROLES)[number]>;
    companyName: FormControl<string | null>;
    limit: FormControl<number | null>;
  }>;

  createForm!: FormGroup<{
    username: FormControl<string | null>;
    fullName: FormControl<string | null>;
    email: FormControl<string | null>;
    phone: FormControl<string | null>;
    password: FormControl<string | null>;
    status: FormControl<(typeof USER_STATUSES)[number] | null>;
    role: FormControl<(typeof USER_ROLES)[number] | null>;
  }>;
  editForm!: FormGroup<{
    username: FormControl<string | null>;
    fullName: FormControl<string | null>;
    email: FormControl<string | null>;
    phone: FormControl<string | null>;
    status: FormControl<(typeof USER_STATUSES)[number] | null>;
    role: FormControl<(typeof USER_ROLES)[number] | null>;
  }>;
  passwordForm!: FormGroup<{ password: FormControl<string | null> }>;

  private sub = new Subscription();

  constructor(
    private readonly fb: FormBuilder,
    private readonly userApi: user.ApiService,
    private readonly companyApi: publicApi.ApiService,
  ) {
    this.filters = this.fb.group({
      email: ['', [emailValidator()]],
      phone: ['', [phone10DigitsValidator()]],
      status: [null as null | (typeof USER_STATUSES)[number]],
      role: [null as null | (typeof USER_ROLES)[number]],
      companyName: [''],
      limit: [DEFAULT_PAGE_LIMIT],
    });
    this.createForm = this.fb.group({
      username: ['', [Validators.required]],
      fullName: ['', [Validators.required, Validators.minLength(7)]],
      email: ['', [Validators.required, emailValidator()]],
      phone: ['', [Validators.required, phone10DigitsValidator()]],
      password: ['', [Validators.required]],
      status: ['active' as (typeof USER_STATUSES)[number]],
      role: ['driver' as (typeof USER_ROLES)[number]],
    });
    this.editForm = this.fb.group({
      username: ['', [Validators.required]],
      fullName: ['', [Validators.required, Validators.minLength(7)]],
      email: ['', [Validators.required, emailValidator()]],
      phone: ['', [Validators.required, phone10DigitsValidator()]],
      status: ['active' as (typeof USER_STATUSES)[number]],
      role: ['driver' as (typeof USER_ROLES)[number]],
    });
    this.passwordForm = this.fb.group({
      password: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    this.fetchCompanies('');

    this.sub.add(
      this.filters.controls.companyName.valueChanges
        .pipe(debounceTime(300), distinctUntilChanged())
        .subscribe((name) => {
          const term = (name ?? '').toString().trim();
          this.companySearchTerm = term;
          this.fetchCompanies(term);
          this.companyDropdownOpen = true;
        }),
    );

    this.applyFilters();

    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      if (target.closest('.dropdown') || target.closest('input[formControlName="companyName"]')) return;
      this.companyDropdownOpen = false;
    };
    window.addEventListener('click', onClick);
    this.sub.add({ unsubscribe: () => window.removeEventListener('click', onClick) });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info') {
    this.notification = { show: true, message, type };
  }

  openCreateModal() {
    this.showCreateModal = true;
  }

  closeCreateModal() {
    this.showCreateModal = false;
    this.creatingUser = false;
    this.showCreatePassword = false;
    this.createForm.reset({
      username: '',
      fullName: '',
      email: '',
      phone: '',
      password: '',
      status: 'active',
      role: 'driver',
    });
  }

  toggleCreatePassword() {
    this.showCreatePassword = !this.showCreatePassword;
  }

  toggleUpdatePassword() {
    this.showUpdatePassword = !this.showUpdatePassword;
  }

  openEditModal(u: User) {
    this.selectedActionUser = u;
    this.showEditModal = true;
    this.editForm.reset({
      username: u.username,
      fullName: u.fullName,
      email: u.email,
      phone: u.phone,
      status: u.status,
      role: u.role,
    });
  }

  closeEditModal() {
    this.showEditModal = false;
    this.editingUserLoading = false;
    this.selectedActionUser = null;
  }

  openPasswordModal(u: User) {
    this.selectedActionUser = u;
    this.showPasswordModal = true;
    this.showUpdatePassword = false;
    this.passwordForm.reset({ password: '' });
  }

  closePasswordModal() {
    this.showPasswordModal = false;
    this.updatingPasswordLoading = false;
    this.showUpdatePassword = false;
    this.selectedActionUser = null;
  }

  openDeleteModal(u: User) {
    this.selectedActionUser = u;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.deletingUserLoading = false;
    this.selectedActionUser = null;
  }

  selectCompany(c: Company | null) {
    this.selectedCompany = c;
    this.filters.controls.companyName.setValue(c?.name ?? '', { emitEvent: false });
    this.companyDropdownOpen = false;
    this.applyFilters();
  }

  reset() {
    this.selectedCompany = null;
    this.filters.reset({
      email: '',
      phone: '',
      status: null,
      role: null,
      companyName: '',
      limit: DEFAULT_PAGE_LIMIT,
    });
    this.applyFilters();
  }

  submitCreateUser() {
    if (this.createForm.invalid) {
      this.createForm.markAllAsTouched();
      this.showNotification(this.getCreateFormErrorMessage(), 'warning');
      return;
    }

    const v = this.createForm.getRawValue();
    const password = (v.password ?? '').trim();
    if (!isValidPassword(password)) {
      this.showNotification(PASSWORD_MESSAGE, 'warning');
      return;
    }

    this.creatingUser = true;
    this.userApi
      .createUser({
        username: (v.username ?? '').trim(),
        fullName: (v.fullName ?? '').trim(),
        email: (v.email ?? '').trim(),
        phone: (v.phone ?? '').trim(),
        password,
        status: (v.status ?? 'active') as (typeof USER_STATUSES)[number],
        role: (v.role ?? 'driver') as (typeof USER_ROLES)[number],
      })
      .subscribe({
        next: (res: CreateUserResponse) => {
          this.showNotification('Created.', 'success');
          this.closeCreateModal();
          this.applyFilters();
        },
        error: (err: any) => {
          this.showNotification(err.error?.message || 'Failed to create user.', 'error');
          this.creatingUser = false;
        },
      });
  }

  private getCreateFormErrorMessage(): string {
    const controls = this.createForm.controls;

    if (controls.username.errors?.['required']) return 'Username is required.';
    if (controls.fullName.errors?.['required']) return 'Full name is required.';
    if (controls.fullName.errors?.['minlength']) return 'Full name must be at least 7 characters.';
    if (controls.email.errors?.['required']) return 'Email is required.';
    if (controls.email.errors?.['email']) return 'Email is invalid.';
    if (controls.phone.errors?.['required']) return 'Phone is required.';
    if (controls.phone.errors?.['phone10Digits']) return 'Phone must be exactly 10 digits.';
    if (controls.password.errors?.['required']) return 'Password is required.';
    if (controls.status.errors?.['required']) return 'Status is required.';
    if (controls.role.errors?.['required']) return 'Role is required.';

    return 'Please fill all required fields correctly.';
  }

  submitEditUser() {
    if (!this.selectedActionUser) return;
    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      this.showNotification('Please enter valid data for edit form.', 'warning');
      return;
    }
    const v = this.editForm.getRawValue();
    this.editingUserLoading = true;
    this.userApi
      .updateUser(this.selectedActionUser.id, {
        username: (v.username ?? '').trim(),
        fullName: (v.fullName ?? '').trim(),
        email: (v.email ?? '').trim(),
        phone: (v.phone ?? '').trim(),
        status: (v.status ?? 'active') as (typeof USER_STATUSES)[number],
        role: (v.role ?? 'driver') as (typeof USER_ROLES)[number],
      })
      .subscribe({
        next: (res: UpdateUserResponse) => {
          this.users = this.users.map((item) => (item.id === res.user.id ? { ...item, ...res.user } : item));
          this.showNotification('Updated.', 'success');
          this.closeEditModal();
        },
        error: (err: any) => {
          this.showNotification(err.error?.message || 'Failed to update user.', 'error');
          this.editingUserLoading = false;
        },
      });
  }

  submitUpdatePassword() {
    if (!this.selectedActionUser) return;
    const password = (this.passwordForm.controls.password.value ?? '').trim();
    if (!password) {
      this.showNotification('Password is required.', 'warning');
      return;
    }
    if (!isValidPassword(password)) {
      this.showNotification(PASSWORD_MESSAGE, 'warning');
      return;
    }
    this.updatingPasswordLoading = true;
    this.userApi.updatePassword(this.selectedActionUser.id, password).subscribe({
      next: (res: UpdateUserPasswordResponse) => {
        this.showNotification(`Password updated: ${res.password}`, 'success');
        this.closePasswordModal();
      },
      error: (err: any) => {
        this.showNotification(err.error?.message || 'Failed to update password.', 'error');
        this.updatingPasswordLoading = false;
      },
    });
  }

  submitDeleteUser() {
    if (!this.selectedActionUser) return;
    this.deletingUserLoading = true;
    this.userApi.deleteUser(this.selectedActionUser.id).subscribe({
      next: (res: DeleteUserResponse) => {
        this.users = this.users.filter((item) => item.id !== res.user.id);
        this.showNotification('Deleted.', 'success');
        this.closeDeleteModal();
      },
      error: (err: any) => {
        this.showNotification(err.error?.message || 'Failed to delete user.', 'error');
        this.deletingUserLoading = false;
      },
    });
  }

  applyFilters() {
    if (this.filters.invalid) {
      this.filters.markAllAsTouched();
      this.showNotification('Please fix validation errors.', 'warning');
      return;
    }
    this.loading = true;
    this.users = [];
    this.nextCursor = null;

    const v = this.filters.getRawValue();

    this.userApi
      .getUsers({
        limit: Number(v.limit) || DEFAULT_PAGE_LIMIT,
        status: v.status ?? undefined,
        role: v.role ?? undefined,
        companyId: this.selectedCompany?.id,
        email: v.email?.trim() || undefined,
        phone: v.phone?.trim() || undefined,
      })
      .subscribe({
        next: (res: UserListResponse) => {
          this.users = res.users ?? [];
          this.nextCursor = res.next ?? null;
          this.loading = false;
        },
        error: (err: any) => {
          this.showNotification(err.error?.message || 'Failed to fetch users.', 'error');
          this.loading = false;
        },
      });
  }

  loadMore() {
    if (this.nextCursor === null) return;
    if (this.filters.invalid) return;
    this.loadingMore = true;

    const v = this.filters.getRawValue();
    this.userApi
      .getUsers({
        limit: Number(v.limit) || DEFAULT_PAGE_LIMIT,
        next: this.nextCursor,
        status: v.status ?? undefined,
        role: v.role ?? undefined,
        companyId: this.selectedCompany?.id,
        email: v.email?.trim() || undefined,
        phone: v.phone?.trim() || undefined,
      })
      .subscribe({
        next: (res: UserListResponse) => {
          this.users = [...this.users, ...(res.users ?? [])];
          this.nextCursor = res.next ?? null;
          this.loadingMore = false;
        },
        error: (err: any) => {
          this.showNotification(err.error?.message || 'Failed to load more users.', 'error');
          this.loadingMore = false;
        },
      });
  }

  onCompanyDropdownScroll(event: Event) {
    const el = event.target as HTMLElement;
    const reachedBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 16;
    if (!reachedBottom) return;
    this.fetchMoreCompanies();
  }

  private fetchMoreCompanies() {
    if (this.companyNextCursor === null) return;
    if (this.companiesLoading || this.companiesLoadingMore) return;

    this.companiesLoadingMore = true;
    this.companyApi
      .getCompanies(this.COMPANY_PAGE_LIMIT, this.companyNextCursor, this.companySearchTerm || undefined)
      .subscribe({
      next: (res: CompanyListResponse) => {
        const incoming = res.companies ?? [];
        const existingIds = new Set(this.companies.map((c) => c.id));
        const merged = incoming.filter((c) => !existingIds.has(c.id));
        this.companies = [...this.companies, ...merged];
        this.companyNextCursor = res.next ?? null;
        this.companiesLoadingMore = false;
      },
      error: () => {
        this.companiesLoadingMore = false;
      },
    });
  }

  private fetchCompanies(name: string) {
    this.companiesLoading = true;
    this.companies = [];
    this.companyNextCursor = null;

    this.companyApi.getCompanies(this.COMPANY_PAGE_LIMIT, undefined, name || undefined).subscribe({
      next: (res: CompanyListResponse) => {
        this.companies = res.companies ?? [];
        this.companyNextCursor = res.next ?? null;
        this.companiesLoading = false;
        this.companiesLoadingMore = false;
      },
      error: () => {
        this.companies = [];
        this.companyNextCursor = null;
        this.companiesLoading = false;
        this.companiesLoadingMore = false;
      },
    });
  }
}
