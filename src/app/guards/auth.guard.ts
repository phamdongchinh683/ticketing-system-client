import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const token = localStorage.getItem('token');
  const router = inject(Router);

  if (!token) {
    router.navigate(['/login']);
    return false;
  }

  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role === 'super_admin') return true;
  } catch {}

  router.navigate(['/unauthorized']);
  return false;
};
