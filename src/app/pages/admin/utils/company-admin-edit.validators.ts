import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export function companyAdminEditPhoneValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = (control.value ?? '').toString().trim();
    if (!raw) return null;
    const d = raw.replace(/\D/g, '');
    if (d.length >= 10) return null;
    return { phone: true };
  };
}
