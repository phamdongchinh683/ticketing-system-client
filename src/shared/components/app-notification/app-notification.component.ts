import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notification',
  imports: [CommonModule],
  template: `
    <div *ngIf="visible" class="notification" [class]="'notification--' + type" (click)="close()">
      <span class="notification__icon">{{ icon }}</span>
      <span class="notification__message">{{ message }}</span>
      <button class="notification__close">&times;</button>
    </div>
  `,
  styles: [`
    .notification {
      position: fixed; top: 24px; left: 50%; transform: translateX(-50%);
      z-index: 9999; min-width: 300px; max-width: 500px;
      display: flex; align-items: center; gap: 10px;
      padding: 14px 18px; border-radius: 8px;
      font-size: 14px; cursor: pointer;
      animation: slideIn 0.3s ease;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .notification--success { background: #e8f5e9; color: #2e7d32; border: 1px solid #a5d6a7; }
    .notification--error   { background: #fce4ec; color: #c62828; border: 1px solid #ef9a9a; }
    .notification--warning { background: #fff3e0; color: #e65100; border: 1px solid #ffcc80; }
    .notification--info    { background: #e3f2fd; color: #1565c0; border: 1px solid #90caf9; }
    .notification__icon { font-size: 18px; }
    .notification__message { flex: 1; }
    .notification__close {
      background: none; border: none; font-size: 18px;
      cursor: pointer; color: inherit; opacity: 0.6;
    }
    .notification__close:hover { opacity: 1; }
  `],
})
export class AppNotificationComponent implements OnInit, OnDestroy {
  @Input() message = '';
  @Input() type: 'success' | 'error' | 'warning' | 'info' = 'info';
  @Input() duration = 3000; 
  @Output() closed = new EventEmitter<void>();

  visible = true;
  private timer: ReturnType<typeof setTimeout> | null = null;

  get icon(): string {
    const icons: Record<string, string> = {
      success: '\u2713',
      error: '\u2717',
      warning: '\u26A0',
      info: '\u24D8',
    };
    return icons[this.type] || icons['info'];
  }

  ngOnInit() {
    this.timer = setTimeout(() => this.close(), this.duration);
  }

  close() {
    this.visible = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.closed.emit();
  }

  ngOnDestroy() {
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }
}
