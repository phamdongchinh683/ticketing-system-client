import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading"
      class="app-btn"
      [class.app-btn--loading]="loading"
      (click)="onClick()"
    >
      <span *ngIf="loading" class="spinner"></span>
      <span>{{ loading ? loadingText : label }}</span>
    </button>
  `,
  styles: [`
    .app-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      width: 100%; padding: 12px 24px;
      background: #1976d2; color: white; border: none; border-radius: 6px;
      font-size: 16px; cursor: pointer; transition: background 0.2s;
    }
    .app-btn:hover { background: #1565c0; }
    .app-btn:disabled { background: #90caf9; cursor: not-allowed; }
    .spinner {
      width: 16px; height: 16px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class AppButtonComponent {
  @Input() label = 'Button';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() loading = false;
  @Input() loadingText = 'Loading...';
  @Input() disabled = false;
  @Output() btnClick = new EventEmitter<void>();

  onClick() {
    if (!this.loading && !this.disabled) {
      this.btnClick.emit();
    }
  }
}
