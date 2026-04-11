import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-company-admin-toolbar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './company-admin-toolbar.component.html',
  styleUrl: './company-admin-toolbar.component.css',
})
export class CompanyAdminToolbarComponent {
  @Input({ required: true }) limit!: number;
  @Input({ required: true }) pageLimits: number[] = [];
  @Output() limitChange = new EventEmitter<number>();
  @Output() createClick = new EventEmitter<void>();
  onLimitSelect(value: string) {
    this.limitChange.emit(Number(value));
  }
}
