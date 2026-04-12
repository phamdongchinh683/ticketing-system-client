import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main-topbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './main-topbar.component.html',
  styleUrl: './main-topbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainTopbarComponent {
  @Input() pageTitle = '';

  @Output() signOut = new EventEmitter<void>();
}
