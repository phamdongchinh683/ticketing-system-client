import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompanyAdmin } from '../../../../data/interfaces/company-admin';

@Component({
  selector: 'app-company-admin-table',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './company-admin-table.component.html',
  styleUrl: './company-admin-table.component.css',
})
export class CompanyAdminTableComponent {
  @Input() admins: CompanyAdmin[] = [];
  @Input() loading = false;
  @Output() updateClick = new EventEmitter<CompanyAdmin>();

  displayStatus(value: string): string {
    switch (value) {
      case 'active':
        return 'Hoạt động';
      case 'inactive':
        return 'Tạm ngưng';
      case 'banned':
        return 'Bị cấm';
      default:
        return value;
    }
  }
}
