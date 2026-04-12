import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { PageLimit } from '../../../../data/constants';

@Component({
  selector: 'app-company-admin-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './company-admin-toolbar.component.html',
  styleUrl: './company-admin-toolbar.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyAdminToolbarComponent {
  @Input({ required: true }) limit!: PageLimit;
  @Input({ required: true }) pageLimits: readonly PageLimit[] = [];

  @Output() limitChange = new EventEmitter<PageLimit>();
  @Output() createClick = new EventEmitter<void>();
}
