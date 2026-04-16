import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  imports: [CommonModule],
  templateUrl: './app-button.component.html',
  styleUrl: './app-button.component.css',
})
export class AppButtonComponent {
  @Input() label = 'Nút';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() loading = false;
  @Input() loadingText = 'Đang tải...';
  @Input() disabled = false;
  @Output() btnClick = new EventEmitter<void>();

  onClick() {
    if (!this.loading && !this.disabled) {
      this.btnClick.emit();
    }
  }
}
