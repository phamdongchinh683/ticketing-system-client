import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Company } from '../../../../data/interfaces/company';

@Component({
  selector: 'app-company-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './company-form-modal.component.html',
  styleUrls: ['../../styles/company-shared.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyFormModalComponent {
  @Input() open = false;
  @Input({ required: true }) form!: FormGroup;
  @Input() editingCompany: Company | null = null;
  @Input() submitting = false;

  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<void>();

  close(): void {
    this.closed.emit();
  }

  stopPropagation(ev: Event): void {
    ev.stopPropagation();
  }
}
