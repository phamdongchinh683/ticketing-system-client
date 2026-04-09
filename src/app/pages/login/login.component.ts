import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { auth } from '../../data/services/index';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule],
  template: `
    <app-notification
      *ngIf="notification.show"
      [message]="notification.message"
      [type]="notification.type"
      (closed)="notification.show = false"
    ></app-notification>

    <div class="page">
      <div class="login-box">
        <h1>Sign In</h1>
        <form (ngSubmit)="onSubmit()">
          <app-input
            label="Username, Email or Phone"
            type="text"
            [(ngModel)]="text"
            name="text"
            placeholder="Enter your username, email or phone"
            [disabled]="loading"
          ></app-input>

          <app-input
            label="Password"
            type="password"
            [(ngModel)]="password"
            name="password"
            placeholder="••••••••"
            [disabled]="loading"
          ></app-input>

          <app-button label="Sign In" type="submit" [loading]="loading" loadingText="Signing in..."></app-button>
        </form>
      </div>
    </div>
  `,
  styles: [
    `
      .page {
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        padding: 20px;
      }
      .login-box {
        width: 100%;
        max-width: 380px;
        padding: 32px;
        background: var(--color-surface);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-md);
      }
      h1 {
        text-align: center;
        color: var(--color-text-dark);
        margin-bottom: 24px;
      }
    `,
  ],
})
export class LoginComponent {
  text = '';
  password = '';
  loading = false;
  notification: { show: boolean; message: string; type: 'success' | 'error' | 'warning' | 'info' } = {
    show: false,
    message: '',
    type: 'error',
  };

  private readonly PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#@$%&!*?^_])(?!.*\s).+$/;
  private readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  constructor(
    private api: auth.ApiService,
    private router: Router,
  ) {}

  showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info') {
    this.notification = { show: true, message, type };
  }

  private validateText(text: string): string | null {
    if (this.EMAIL_REGEX.test(text)) {
      return null; 
    }
    if (/^\+?\d+$/.test(text)) {
      if (text.length < 10) return 'Phone number must be at least 10 digits.';
      return null;
    }
    if (text.length < 5) return 'Username must be at least 5 characters.';
    return null;
  }

  onSubmit() {
    this.notification.show = false;

    const text = this.text.trim();
    const password = this.password;

    if (!text || !password) {
      this.showNotification('Please fill in all fields.', 'warning');
      return;
    }

    const textError = this.validateText(text);
    if (textError) {
      this.showNotification(textError, 'warning');
      return;
    }

    if (!this.PASSWORD_REGEX.test(password)) {
      this.showNotification(
        'Password must contain uppercase, lowercase, a number, and one special character (# @ $ % & ! * ? ^ _), and no spaces.',
        'warning',
      );
      return;
    }

    this.loading = true;

    this.api.signIn(this.text.trim(), this.password).subscribe({
      next: (res: any) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));

        this.showNotification('Success', 'success');
        this.router.navigate(['/dashboard']);
      },
      error: (err: any) => {
        this.showNotification(err.error?.message || 'Failed to sign in.', 'error');
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
}
