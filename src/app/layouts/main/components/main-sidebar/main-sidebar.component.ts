import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

export interface MainNavItem {
  label: string;
  route: string;
  icon: string;
}

@Component({
  selector: 'app-main-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './main-sidebar.component.html',
  styleUrl: './main-sidebar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainSidebarComponent {
  @Input({ required: true }) items: MainNavItem[] = [];
  @Input() currentUrl = '';
  @Input() userInitial = 'U';
  @Input() userName = 'Người dùng';
  @Input() userRole = '';
  @Input() userEmail = '';

  constructor(private readonly sanitizer: DomSanitizer) {}

  asSafeIcon(icon: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(icon);
  }
}
