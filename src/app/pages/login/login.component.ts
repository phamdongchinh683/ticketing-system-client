import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { auth } from '../../data/services/index';
import { SharedModule } from '@app/shared/shared.module';
import { isEmail, isValidPassword, PASSWORD_MESSAGE } from '@app/shared/utils/validators';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);

  loginForm = this.fb.nonNullable.group({
    text: [''],
    password: [''],
  });

  loading = false;
  notification: { show: boolean; message: string; type: 'success' | 'error' | 'warning' | 'info' } = {
    show: false,
    message: '',
    type: 'error',
  };

  constructor(
    private readonly api: auth.ApiService,
    private readonly router: Router,
  ) {}

  showNotification(message: string, type: 'success' | 'error' | 'warning' | 'info') {
    this.notification = { show: true, message, type };
  }

  private validateText(text: string): string | null {
    if (isEmail(text)) {
      return null;
    }
    if (/^\+?\d+$/.test(text)) {
      if (text.length < 10) return 'Số điện thoại phải có ít nhất 10 chữ số.';
      return null;
    }
    if (text.length < 5) return 'Tên đăng nhập phải có ít nhất 5 ký tự.';
    return null;
  }

  onSubmit() {
    this.notification.show = false;

    const { text: rawText, password } = this.loginForm.getRawValue();
    const text = rawText.trim();

    if (!text || !password) {
      this.showNotification('Vui lòng điền đầy đủ thông tin.', 'warning');
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

    this.api.signIn(text, password).subscribe({
      next: (res: { token: string; user: unknown }) => {
        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));

        this.showNotification('Đăng nhập thành công', 'success');
        this.router.navigate(['/dashboard']);
      },
      error: (err: { error?: { message?: string } }) => {
        this.showNotification(err.error?.message || 'Đăng nhập thất bại.', 'error');
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      },
    });
  }
}
