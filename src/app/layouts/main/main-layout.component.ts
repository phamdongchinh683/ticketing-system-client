import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { navItems } from '../../data/mocks';
import { auth } from '../../data/services';
import { MainSidebarComponent, type MainNavItem } from './components/main-sidebar/main-sidebar.component';
import { MainTopbarComponent } from './components/main-topbar/main-topbar.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, MainSidebarComponent, MainTopbarComponent],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
})
export class MainLayoutComponent implements OnInit {
  collapsed = false;
  currentUrl = '';
  userName = 'Người dùng';
  userEmail = '';
  userRole = '';
  userInitial = 'U';

  items: MainNavItem[] = navItems as MainNavItem[];

  private readonly pageTitles: Record<string, string> = {
    '/dashboard': 'Tổng quan',
    '/companies': 'Nhà xe',
    '/admins': 'Quản trị công ty',
    '/users': 'Người dùng',
    '/devices': 'Thiết bị',
    '/password': 'Đổi mật khẩu',
  };

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(auth.ApiService);

  get pageTitle(): string {
    return this.pageTitles[this.currentUrl] || 'Tổng quan';
  }

  ngOnInit() {
    this.loadUser();

    this.currentUrl = this.router.url;
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((e) => {
        this.currentUrl = e.urlAfterRedirects || e.url;
      });
  }

  logout() {
    this.api.logout().subscribe(() => this.handleLogoutSuccess());
  }

  private loadUser() {
    const raw = localStorage.getItem('user');
    if (!raw) return;
    try {
      const user = JSON.parse(raw) as {
        fullName?: string;
        username?: string;
        email?: string;
        staffProfileRole?: string;
        role?: string;
      };
      this.userName = user.fullName || user.username || 'Người dùng';
      this.userEmail = user.email || '';
      this.userRole = (user.staffProfileRole || user.role || '').replace(/_/g, ' ');
      this.userInitial = this.userName.charAt(0).toUpperCase();
    } catch {
      /* ignore */
    }
  }

  private handleLogoutSuccess() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }
}
