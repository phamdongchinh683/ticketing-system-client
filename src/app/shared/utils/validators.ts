import type { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const DIGITS_ONLY_REGEX = /^\d+$/;
export const PHONE_10_DIGITS_REGEX = /^\d{10}$/;
export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[#@$%&!*?^_])(?!.*\s).+$/;
export const PASSWORD_MESSAGE =
  'Password must contain uppercase, lowercase, a number, and one special character (# @ $ % & ! * ? ^ _), and no spaces';

export function isEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim());
}

export function isDigitsOnly(value: string): boolean {
  return DIGITS_ONLY_REGEX.test(value.trim());
}

export function isPhoneInput(value: string): boolean {
  return /^\+?\d+$/.test(value.trim());
}

export function isPhone10Digits(value: string): boolean {
  return PHONE_10_DIGITS_REGEX.test(value.trim());
}

export function phone10DigitsValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = (control.value ?? '').toString().trim();
    if (!raw) return null;
    return isPhone10Digits(raw) ? null : { phone10Digits: true };
  };
}

export function emailValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = (control.value ?? '').toString().trim();
    if (!raw) return null;
    return isEmail(raw) ? null : { email: true };
  };
}

export function isValidPassword(value: string): boolean {
  return PASSWORD_REGEX.test(value.trim());
}

export function passwordValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const raw = (control.value ?? '').toString().trim();
    if (!raw) return null;
    return isValidPassword(raw) ? null : { password: true };
  };
}