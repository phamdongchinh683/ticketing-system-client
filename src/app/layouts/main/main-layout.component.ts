import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { navItems } from '../../data/mocks';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.css',
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
