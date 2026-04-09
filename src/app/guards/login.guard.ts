import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const loginGuard: CanActivateFn = () => {
  const token = localStorage.getItem('token');

  if (token) {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.staffProfileRole === 'super_admin' && user.role === 'admin') {
        inject(Router).navigate(['/dashboard']);
        return false;
      }
    } catch {}
  }

  return true;
};
