import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { PageLimit } from '../../../../data/constants';
import { Company } from '../../../../data/interfaces/company';

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
  @Input() companies: Company[] = [];
  @Input() selectedCompanyId: number | null = null;

  @Output() limitChange = new EventEmitter<PageLimit>();
  @Output() companyFilterChange = new EventEmitter<number | null>();
  @Output() createClick = new EventEmitter<void>();
}
