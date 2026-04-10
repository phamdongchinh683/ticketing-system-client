import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { navItems } from '../../data/mocks';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  template: `
    <div class="layout">
      <aside class="sidebar" [class.sidebar--collapsed]="collapsed">
        <div class="sidebar__brand">
          <div class="brand-icon">TS</div>
          <span *ngIf="!collapsed" class="brand-text">Ticket System</span>
        </div>

        <nav class="sidebar__nav">
          @for (item of items; track item.route) {
            <a
              class="nav-item"
              [class.nav-item--active]="currentUrl === item.route"
              [routerLink]="item.route"
              [title]="item.label"
            >
              <span class="nav-item__icon" [innerHTML]="item.icon"></span>
              <span *ngIf="!collapsed" class="nav-item__label">{{ item.label }}</span>
            </a>
          }
        </nav>

        <div class="sidebar__footer">
          <div class="user-block">
            <div class="user-avatar">{{ userInitial }}</div>
            <div *ngIf="!collapsed" class="user-info">
              <span class="user-name">{{ userName }}</span>
              <span class="user-role">{{ userRole }}</span>
            </div>
          </div>
          <button class="btn-collapse" (click)="collapsed = !collapsed" [title]="collapsed ? 'Expand' : 'Collapse'">
            <svg [class.rotate]="collapsed" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        </div>
      </aside>

      <main class="main-content">
        <header class="topbar">
          <div class="topbar__title">{{ pageTitle }}</div>
          <button class="btn-logout" (click)="logout()">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </header>
        <div class="page-content">
          <router-outlet></router-outlet>
        </div>
      </main>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        height: 100vh;
        overflow: hidden;
      }

      .layout {
        display: flex;
        height: 100vh;
      }

      .sidebar {
        width: var(--sidebar-width);
        background: var(--sidebar-bg);
        color: white;
        display: flex;
        flex-direction: column;
        transition: width 0.25s ease;
        flex-shrink: 0;
      }
      .sidebar--collapsed {
        width: var(--sidebar-collapsed);
      }

      .sidebar__brand {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 20px 16px;
        border-bottom: 1px solid var(--sidebar-border);
      }
      .brand-icon {
        width: 40px;
        height: 40px;
        background: linear-gradient(135deg, var(--color-primary), #8b5cf6);
        border-radius: var(--radius-lg);
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 16px;
        flex-shrink: 0;
      }
      .brand-text {
        font-size: 18px;
        font-weight: 700;
        letter-spacing: -0.5px;
        white-space: nowrap;
      }

      .sidebar__nav {
        flex: 1;
        padding: 12px 8px;
        display: flex;
        flex-direction: column;
        gap: 2px;
        overflow-y: auto;
      }
      .nav-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 12px;
        border-radius: var(--radius-md);
        color: var(--color-text);
        text-decoration: none;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.15s ease;
        cursor: pointer;
        white-space: nowrap;
      }
      .nav-item:hover {
        background: var(--sidebar-hover);
        color: var(--color-text-light);
      }
      .nav-item--active {
        background: var(--color-primary-bg);
        color: var(--color-primary-light);
      }
      .nav-item__icon {
        width: 22px;
        height: 22px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
      }
      .nav-item__icon ::ng-deep svg {
        width: 20px;
        height: 20px;
      }

      .sidebar__footer {
        padding: 12px 8px;
        border-top: 1px solid var(--sidebar-border);
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .user-block {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 8px 12px;
      }
      .user-avatar {
        width: 36px;
        height: 36px;
        background: linear-gradient(135deg, #f472b6, #fb923c);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        font-size: 14px;
        flex-shrink: 0;
      }
      .user-info {
        display: flex;
        flex-direction: column;
        overflow: hidden;
      }
      .user-name {
        font-size: 13px;
        font-weight: 600;
        color: var(--color-text-light);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .user-role {
        font-size: 11px;
        color: var(--color-text-muted);
        text-transform: capitalize;
      }
      .btn-collapse {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 8px;
        background: none;
        border: none;
        color: var(--color-text-muted);
        cursor: pointer;
        border-radius: var(--radius-sm);
        transition: color 0.15s;
      }
      .btn-collapse:hover {
        color: var(--color-text-light);
      }
      .btn-collapse svg {
        width: 18px;
        height: 18px;
        transition: transform 0.25s;
      }
      .btn-collapse .rotate {
        transform: rotate(180deg);
      }

      .main-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: var(--color-surface);
      }

      .topbar {
        height: 60px;
        background: var(--color-surface);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 28px;
        border-bottom: 1px solid var(--color-border);
        flex-shrink: 0;
      }
      .topbar__title {
        font-size: 18px;
        font-weight: 600;
        color: var(--color-text-dark);
      }
      .btn-logout {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 16px;
        background: none;
        border: 1px solid var(--color-border);
        border-radius: var(--radius-md);
        color: var(--color-text-muted);
        font-size: 13px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .btn-logout svg {
        width: 16px;
        height: 16px;
      }
      .btn-logout:hover {
        background: var(--color-red-bg);
        border-color: var(--color-red-border);
        color: var(--color-red);
      }

      .page-content {
        flex: 1;
        overflow-y: auto;
      }
    `,
  ],
})
export class MainLayoutComponent implements OnInit {
  collapsed = false;
  currentUrl = '';
  userName = 'User';
  userRole = '';
  userInitial = 'U';

  items = navItems;

  private pageTitles: Record<string, string> = {
    '/home': 'Dashboard',
    '/companies': 'Bus Companies',
    '/admins': 'Company Admins',
    '/users': 'Users',
  };

  get pageTitle(): string {
    return this.pageTitles[this.currentUrl] || 'Dashboard';
  }

  constructor(private router: Router) {}

  ngOnInit() {
    
    this.loadUser();

    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      this.currentUrl = e.urlAfterRedirects || e.url;
    });
    this.currentUrl = this.router.url;
  }




  private loadUser() {
    const raw = localStorage.getItem('user');
    if (!raw) return;
    try {
      const user = JSON.parse(raw);
      this.userName = user.fullName || user.username || 'User';
      this.userRole = (user.staffProfileRole || user.role || '').replace(/_/g, ' ');
      this.userInitial = this.userName.charAt(0).toUpperCase();

      this.items = this.items.map((item) => item);
    } catch {}
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
