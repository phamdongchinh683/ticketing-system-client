import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

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
  @Input() collapsed = false;
  @Input({ required: true }) items: MainNavItem[] = [];
  @Input() currentUrl = '';
  @Input() userInitial = 'U';
  @Input() userName = 'User';
  @Input() userRole = '';

  @Output() toggleCollapse = new EventEmitter<void>();
}
