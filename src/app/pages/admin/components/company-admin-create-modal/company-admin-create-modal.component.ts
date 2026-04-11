import { Component, EventEmitter, inject, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Company } from '../../../../data/interfaces/company';
import { CreateCompanyAdminBody } from '../../../../data/interfaces/company-admin';
import { emailValidator, PASSWORD_MESSAGE, passwordValidator } from '../../../../../shared/utils/validators';
import { digitsOnlyPhone } from '../../utils/company-admin.mapper';
import { companyAdminEditPhoneValidator } from '../../utils/company-admin-edit.validators';

@Component({
  selector: 'app-company-admin-create-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './company-admin-create-modal.component.html',
  styleUrl: './company-admin-create-modal.component.css',
})
export class CompanyAdminCreateModalComponent implements OnChanges {
  private readonly fb = inject(FormBuilder);

  @Input() open = false;
  @Input() companies: Company[] = [];
  @Input() submitting = false;
  @Output() openChange = new EventEmitter<boolean>();
  @Output() submitted = new EventEmitter<CreateCompanyAdminBody>();
  @Output() validateFailed = new EventEmitter<string>();

  showPassword = false;

  form = this.fb.group({
    username: ['', [Validators.required]],
    fullName: ['', [Validators.required, Validators.minLength(7)]],
    email: ['', [Validators.required, emailValidator()]],
    phone: ['', [Validators.required, companyAdminEditPhoneValidator()]],
    password: ['', [Validators.required, passwordValidator()]],
    companyId: [null as number | null, [Validators.required]],
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['open'] && !this.open) {
      this.reset();
    }
  }

  close() {
    this.openChange.emit(false);
  }

  reset() {
    this.showPassword = false;
    this.form.reset({
      username: '',
      fullName: '',
      email: '',
      phone: '',
      password: '',
      companyId: null,
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.validateFailed.emit(this.firstFormErrorMessage());
      return;
    }
    const v = this.form.getRawValue();
    const companyId = v.companyId;
    if (companyId === null || companyId === undefined) return;

    this.submitted.emit({
      username: (v.username ?? '').trim(),
      fullName: (v.fullName ?? '').trim(),
      contactInfo: {
        email: (v.email ?? '').trim(),
        phone: digitsOnlyPhone(v.phone ?? ''),
      },
      password: (v.password ?? '').trim(),
      companyId: Number(companyId),
    });
  }

  private firstFormErrorMessage(): string {
    const c = this.form.controls;
    if (c.username.errors?.['required']) return 'Username is required.';
    if (c.fullName.errors?.['required']) return 'Full name is required.';
    if (c.fullName.errors?.['minlength']) return 'Full name must be at least 7 characters.';
    if (c.email.errors?.['required']) return 'Email is required.';
    if (c.email.errors?.['email']) return 'Email format is invalid.';
    if (c.phone.errors?.['required']) return 'Phone is required.';
    if (c.phone.errors?.['phone']) return 'Phone must be 9–11 digits.';
    if (c.password.errors?.['required']) return 'Password is required.';
    if (c.password.errors?.['password']) return PASSWORD_MESSAGE;
    if (c.companyId.errors?.['required']) return 'Please select a company.';
    return 'Please fix the form.';
  }

  private showFieldError(control: AbstractControl): boolean {
    return control.touched || control.dirty;
  }

  get usernameError(): string | null {
    const c = this.form.controls.username;
    if (!this.showFieldError(c)) return null;
    if (c.errors?.['required']) return 'Username is required.';
    return null;
  }

  get fullNameError(): string | null {
    const c = this.form.controls.fullName;
    if (!this.showFieldError(c)) return null;
    if (c.errors?.['required']) return 'Full name is required.';
    if (c.errors?.['minlength']) return 'At least 7 characters.';
    return null;
  }

  get emailError(): string | null {
    const c = this.form.controls.email;
    if (!this.showFieldError(c)) return null;
    if (c.errors?.['required']) return 'Email is required.';
    if (c.errors?.['email']) return 'Invalid email format.';
    return null;
  }

  get phoneError(): string | null {
    const c = this.form.controls.phone;
    if (!this.showFieldError(c)) return null;
    if (c.errors?.['required']) return 'Phone is required.';
    if (c.errors?.['phone']) return 'Use 9–10 digits.';
    return null;
  }

  get passwordError(): string | null {
    const c = this.form.controls.password;
    if (!this.showFieldError(c)) return null;
    if (c.errors?.['required']) return 'Password is required.';
    if (c.errors?.['password']) return PASSWORD_MESSAGE;
    return null;
  }

  get companyError(): string | null {
    const c = this.form.controls.companyId;
    if (!this.showFieldError(c)) return null;
    if (c.errors?.['required']) return 'Company is required.';
    return null;
  }
}
