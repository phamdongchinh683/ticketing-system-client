import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { navItems } from '../../data/mocks';
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
  userName = 'User';
  userEmail = '';
  userRole = '';
  userInitial = 'U';

  items: MainNavItem[] = navItems as MainNavItem[];

  private readonly pageTitles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/companies': 'Bus Companies',
    '/admins': 'Company Admins',
    '/users': 'Users',
    '/devices': 'Devices',
  };

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  get pageTitle(): string {
    return this.pageTitles[this.currentUrl] || 'Dashboard';
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
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
      this.userName = user.fullName || user.username || 'User';
      this.userEmail = user.email || '';
      this.userRole = (user.staffProfileRole || user.role || '').replace(/_/g, ' ');
      this.userInitial = this.userName.charAt(0).toUpperCase();
    } catch {
      /* ignore */
    }
  }
}
