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
  templateUrl: './app-input.component.html',
  styleUrl: './app-input.component.css',
})
export class AppInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() type: 'text' | 'password' | 'email' | 'number' = 'text';
  @Input() placeholder = '';
  @Input() name = '';
  @Input() disabled = false;
  @Input() errorMessage = '';
  @Input() showPasswordToggle = false;

  passwordVisible = false;
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

  get effectiveType(): 'text' | 'password' | 'email' | 'number' {
    if (this.type === 'password' && this.showPasswordToggle) {
      return this.passwordVisible ? 'text' : 'password';
    }
    return this.type;
  }

  togglePasswordVisibility(): void {
    if (this.type !== 'password' || !this.showPasswordToggle || this.disabled) return;
    this.passwordVisible = !this.passwordVisible;
  }
}
