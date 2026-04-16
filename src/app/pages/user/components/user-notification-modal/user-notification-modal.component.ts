import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-user-notification-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-notification-modal.component.html',
  styleUrls: ['../../styles/user-shared.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserNotificationModalComponent implements OnChanges {
  @Input() open = false;
  @Input() submitting = false;

  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<{ title: string; body: string }>();

  private readonly fb = inject(FormBuilder);
  readonly form = this.fb.group({
    title: ['', [Validators.required, Validators.maxLength(120)]],
    body: ['', [Validators.required, Validators.maxLength(500)]],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open']?.currentValue === true) {
      this.form.reset();
    }
  }

  close(): void {
    this.closed.emit();
  }

  stopPropagation(ev: Event): void {
    ev.stopPropagation();
  }

  submit(ev?: Event): void {
    // Prevent browser default form submit (can cause full page reload).
    ev?.preventDefault();
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    this.submitted.emit({
      title: (v.title ?? '').trim(),
      body: (v.body ?? '').trim(),
    });
  }
}
