import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

type ApiErrorBody = {
  errorCode?: string;
  message?: string;
};

export const authExpiredInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: unknown) => {
      if (shouldRedirectToLogin(error)) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');

        if (router.url !== '/login') {
          void router.navigate(['/login']);
        }
      }

      return throwError(() => error);
    }),
  );
};

function shouldRedirectToLogin(error: unknown): boolean {
  if (!(error instanceof HttpErrorResponse)) return false;

  const body = (error.error ?? {}) as ApiErrorBody;
  const errorCode = (body.errorCode ?? '').toLowerCase();
  const message = (body.message ?? '').toLowerCase();

  if (error.status === 401) return true;
  if (errorCode === 'unauthorized') return true;
  if (message.includes('token expired')) return true;

  return false;
}
