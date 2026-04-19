import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Messaging } from '@angular/fire/messaging';
import { getToken, isSupported } from 'firebase/messaging';
import { catchError, from, map, Observable, of, switchMap } from 'rxjs';
import { navItems } from '../../data/mocks';
import { auth, device } from '../../data/services';
import { firebaseVapidKey } from '../../data/constants';
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
    '/balance': 'Số dư',
    '/password': 'Đổi mật khẩu',
  };

  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly api = inject(auth.ApiService);
  private readonly deviceApi = inject(device.ApiService);
  private readonly messaging = inject(Messaging);

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
    this.deleteCurrentDeviceToken()
      .pipe(
        switchMap(() => this.api.logout()),
        catchError(() => of(null)),
      )
      .subscribe(() => this.handleLogoutSuccess());
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

  private deleteCurrentDeviceToken(): Observable<void> {
    return from(this.getCurrentFcmToken()).pipe(
      switchMap((fcmToken) => {
        if (!fcmToken) return of(void 0);
        return this.deviceApi.getFcmTokens().pipe(
          switchMap((tokens) => {
            const currentDevice = tokens.find((item) => item.fcmToken === fcmToken);
            if (!currentDevice) return of(void 0);
            return this.deviceApi.deleteFcmToken(currentDevice.id).pipe(map(() => void 0));
          }),
          catchError(() => of(void 0)),
        );
      }),
      catchError(() => of(void 0)),
    );
  }

  private async getCurrentFcmToken(): Promise<string | null> {
    if (typeof window === 'undefined') return null;
    if (!(await isSupported())) return null;
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return null;

    const registration = await navigator.serviceWorker.getRegistration('/firebase-messaging-sw.js');
    if (!registration) return null;

    try {
      const token = await getToken(this.messaging, {
        vapidKey: firebaseVapidKey,
        serviceWorkerRegistration: registration,
      });
      return token || null;
    } catch {
      return null;
    }
  }
}
