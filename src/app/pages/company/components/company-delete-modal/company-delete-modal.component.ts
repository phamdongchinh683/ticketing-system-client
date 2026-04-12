import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Company } from '../../../../data/interfaces/company';

@Component({
  selector: 'app-company-delete-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './company-delete-modal.component.html',
  styleUrls: ['../../styles/company-shared.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyDeleteModalComponent {
  @Input() open = false;
  @Input() company: Company | null = null;
  @Input() submitting = false;

  @Output() closed = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }

  stopPropagation(ev: Event): void {
    ev.stopPropagation();
  }
}
