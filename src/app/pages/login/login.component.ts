import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { auth } from '../../data/services/index';
import { SharedModule } from '../../../shared/shared.module';
import { isEmail, isValidPassword, PASSWORD_MESSAGE } from '../../../shared/utils/validators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, SharedModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
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

  constructor(
    private api: auth.ApiService,
    private router: Router,
  ) {}

  showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info') {
    this.notification = { show: true, message, type };
  }

  private validateText(text: string): string | null {
    if (isEmail(text)) {
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

    if (!isValidPassword(password)) {
      this.showNotification(PASSWORD_MESSAGE, 'warning');
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
