import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-user-create-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-create-modal.component.html',
  styleUrl: './user-create-modal.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCreateModalComponent implements OnChanges {
  @Input() open = false;
  @Input({ required: true }) form!: FormGroup;
  @Input() submitting = false;
  @Input() statuses: readonly string[] = [];
  @Input() roles: readonly string[] = [];

  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<void>();

  showPassword = false;

  close(): void {
    this.closed.emit();
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  stopPropagation(ev: Event): void {
    ev.stopPropagation();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue === true) {
      this.showPassword = false;
    }
  }

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

  displayRole(value: string): string {
    switch (value) {
      case 'driver':
        return 'Tài xế';
      case 'customer':
        return 'Khách hàng';
      case 'operator':
        return 'Nhà xe';
      default:
        return value;
    }
  }
}
