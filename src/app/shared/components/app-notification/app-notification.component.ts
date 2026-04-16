import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notification',
  imports: [CommonModule],
  templateUrl: './app-notification.component.html',
  styleUrl: './app-notification.component.css',
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
