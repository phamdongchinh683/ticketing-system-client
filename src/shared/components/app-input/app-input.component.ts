import { Component, Input, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormsModule } from '@angular/forms';

@Component({
  selector: 'app-input',
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AppInputComponent),
      multi: true,
    },
  ],
  template: `
    <div class="field">
      <label *ngIf="label" [attr.for]="name">{{ label }}</label>
      <input
        [type]="type"
        [placeholder]="placeholder"
        [name]="name"
        [disabled]="disabled"
        [value]="value"
        (input)="onInput($event)"
        (blur)="onTouched()"
      />
      <div *ngIf="errorMessage" class="error-msg">{{ errorMessage }}</div>
    </div>
  `,
  styles: [`
    .field { margin-bottom: 16px; }
    .field label {
      display: block;
      margin-bottom: 8px;
      font-size: 13px;
      font-weight: 600;
      color: #374151;
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }
    .field input {
      width: 100%; padding: 10px 12px; border: 1px solid #ccc;
      border-radius: 6px; font-size: 14px; box-sizing: border-box;
      transition: border-color 0.2s;
    }
    .field input:focus { outline: none; border-color: #1976d2; }
    .field input:disabled { background: #f5f5f5; cursor: not-allowed; }
    .error-msg { color: #c62828; font-size: 12px; margin-top: 4px; }
  `],
})
export class AppInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() type: 'text' | 'password' | 'email' | 'number' = 'text';
  @Input() placeholder = '';
  @Input() name = '';
  @Input() disabled = false;
  @Input() errorMessage = '';

  value = '';
  onChange: (value: string) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: string): void {
    this.value = value || '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
    this.onChange(this.value);
  }
}
