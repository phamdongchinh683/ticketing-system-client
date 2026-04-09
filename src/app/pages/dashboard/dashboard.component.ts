import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { dashboard } from '../../data/services/index';
import { DashboardOverview } from '../../data/interfaces/dashboard';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, SharedModule],
  template: `
    <div class="dashboard">
      <div *ngIf="loading" class="loading-container">
        <div class="spinner-large"></div>
        <p>Loading dashboard...</p>
      </div>

      <div *ngIf="!loading && overview" class="cards-grid">
        <app-stat-card label="Total Users" [value]="overview.totalUsers" color="blue">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
        </app-stat-card>

        <app-stat-card label="Total Bookings" [value]="overview.totalBookings" color="green">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
            <line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
        </app-stat-card>

        <app-stat-card label="Total Revenue" [value]="overview.totalRevenue | currency:'VND':'symbol':'1.0-0'" color="orange">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="1" x2="12" y2="23"/>
            <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
          </svg>
        </app-stat-card>

        <app-stat-card label="Total Companies" [value]="overview.totalCompanies" color="purple">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
        </app-stat-card>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 120px 20px;
        color: var(--color-text);
        gap: 16px;
      }
      .spinner-large {
        width: 40px;
        height: 40px;
        border: 3px solid var(--color-border);
        border-top-color: var(--color-primary);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }
      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .cards-grid {
        max-width: 1200px;
        margin: 32px auto;
        padding: 0 32px;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 24px;
      }
    `,
  ],
})
export class DashboardComponent implements OnInit {
  overview: DashboardOverview | null = null;
  loading = true;
  userName = '';
  notification: { show: boolean; message: string; type: 'success' | 'error' | 'warning' | 'info' } = {
    show: false,
    message: '',
    type: 'error',
  };

  constructor(
    private api: dashboard.ApiService,
    private router: Router,
  ) {}

  ngOnInit() {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        this.userName = JSON.parse(user).fullName || JSON.parse(user).username || 'User';
      } catch {
        this.userName = 'User';
      }
    }

    this.api.getDashboard().subscribe({
      next: (res) => {
        this.overview = res.overview;
        this.loading = false;
      },
      error: (err) => {
        this.showNotification(err.error?.message || 'Failed to load dashboard.', 'error');
        this.loading = false;
      },
    });
  }

  showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info') {
    this.notification = { show: true, message, type };
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
