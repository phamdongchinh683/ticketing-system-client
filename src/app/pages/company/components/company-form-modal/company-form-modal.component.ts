import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Company } from '../../../../data/interfaces/company';
import { upload } from '../../../../data/services';

@Component({
  selector: 'app-company-form-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './company-form-modal.component.html',
  styleUrls: ['../../styles/company-shared.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompanyFormModalComponent {
  @Input() open = false;
  @Input({ required: true }) form!: FormGroup;
  @Input() editingCompany: Company | null = null;
  @Input() submitting = false;

  @Output() closed = new EventEmitter<void>();
  @Output() submitted = new EventEmitter<void>();
  @Output() logoUploadError = new EventEmitter<string>();

  uploadingLogo = false;

  constructor(
    private readonly uploadApi: upload.ApiService,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  get canUploadLogo(): boolean {
    return this.editingCompany !== null;
  }

  get logoPreviewUrl(): string {
    const v = this.form?.get('logoUrl')?.value;
    return typeof v === 'string' ? v.trim() : '';
  }

  close(): void {
    this.closed.emit();
  }

  stopPropagation(ev: Event): void {
    ev.stopPropagation();
  }

  triggerLogoFileInput(input: HTMLInputElement): void {
    input.click();
  }

  async onLogoFileChange(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || !this.editingCompany) return;

    this.uploadingLogo = true;
    this.cdr.markForCheck();

    try {
      const presigned = await firstValueFrom(this.uploadApi.getPresigned('company', this.editingCompany.id));
      let uploadFile = file;
      if (file.size >= 800 * 1024 && file.type.startsWith('image/')) {
        const prefersWebp = presigned.acceptedMimeTypes?.includes('image/webp');
        const outputType = prefersWebp ? 'image/webp' : 'image/jpeg';
        const quality = prefersWebp ? 0.8 : 0.82;
        uploadFile = await this.uploadApi.resizeImageFile(file, { maxDimension: 480, outputType, quality });
      }

      if (presigned.acceptedMimeTypes?.length && !presigned.acceptedMimeTypes.includes(uploadFile.type)) {
        throw new Error('This file type is not allowed.');
      }
      const secureUrl = await this.uploadApi.uploadImageToCloudinary(uploadFile, presigned);
      this.form.patchValue({ logoUrl: secureUrl });
    } catch (e: unknown) {
      let message = 'Logo upload failed.';
      if (e instanceof HttpErrorResponse) {
        message = (e.error as { message?: string })?.message ?? e.message ?? message;
      } else if (e instanceof Error) {
        message = e.message;
      }
      this.logoUploadError.emit(message);
    } finally {
      this.uploadingLogo = false;
      this.cdr.markForCheck();
    }
  }
}
