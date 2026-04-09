import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Company } from '../../../app/data/interfaces/company';

@Component({
  selector: 'app-company-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="company-list">
      @for (company of companies; track company.id) {
        <div class="company-card">
          <div class="company-card__logo">
            <img *ngIf="company.logoUrl && company.logoUrl !== 'url here'" [src]="company.logoUrl" [alt]="company.name" />
            <span *ngIf="!company.logoUrl || company.logoUrl === 'url here'" class="company-card__fallback">
              {{ company.name.charAt(0) }}
            </span>
          </div>
          <div class="company-card__info">
            <span class="company-card__name">{{ company.name }}</span>
            <span class="company-card__hotline">{{ company.hotline }}</span>
          </div>
          <div class="company-card__actions">
            <button class="btn-icon btn-icon--edit" (click)="editCompany.emit(company)" title="Edit">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
            <button class="btn-icon btn-icon--delete" (click)="deleteCompany.emit(company)" title="Delete">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      } @empty {
        <div class="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <p>No companies found</p>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .company-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .company-card {
        display: flex;
        align-items: center;
        gap: 14px;
        padding: 14px 16px;
        background: var(--color-surface);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-sm);
        transition: box-shadow 0.15s;
      }
      .company-card:hover {
        box-shadow: var(--shadow-md);
      }
      .company-card__logo {
        width: 42px;
        height: 42px;
        border-radius: var(--radius-lg);
        background: var(--color-blue-bg);
        color: var(--color-blue);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 18px;
        flex-shrink: 0;
        overflow: hidden;
      }
      .company-card__logo img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .company-card__info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .company-card__name {
        font-size: 14px;
        font-weight: 600;
        color: var(--color-text-dark);
      }
      .company-card__hotline {
        font-size: 12px;
        color: var(--color-text-muted);
      }
      .company-card__actions {
        display: flex;
        gap: 4px;
        flex-shrink: 0;
      }
      .btn-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: none;
        border: 1px solid transparent;
        border-radius: var(--radius-sm);
        cursor: pointer;
        transition: all 0.15s;
      }
      .btn-icon svg {
        width: 16px;
        height: 16px;
      }
      .btn-icon--edit {
        color: var(--color-text-muted);
      }
      .btn-icon--edit:hover {
        color: var(--color-primary);
        background: var(--color-primary-bg);
      }
      .btn-icon--delete {
        color: var(--color-text-muted);
      }
      .btn-icon--delete:hover {
        color: var(--color-red);
        background: var(--color-red-bg);
      }

      .empty-state {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        padding: 48px 20px;
        color: var(--color-text);
      }
      .empty-state svg {
        width: 40px;
        height: 40px;
        opacity: 0.4;
      }
      .empty-state p {
        margin: 0;
        font-size: 14px;
      }
    `,
  ],
})
export class AppCompanyListComponent {
  @Input() companies: Company[] = [];
  @Output() editCompany = new EventEmitter<Company>();
  @Output() deleteCompany = new EventEmitter<Company>();
}
