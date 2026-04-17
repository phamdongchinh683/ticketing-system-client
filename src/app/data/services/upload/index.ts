import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { constant } from '../../constants';
import { UploadPresignedResponse } from '../../interfaces/upload';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private readonly http: HttpClient) { }

  getPresigned(folder: string, id: number): Observable<UploadPresignedResponse> {
    return this.http.get<UploadPresignedResponse>(`${constant.baseUrl}/file/upload/super-admin/presigned`, {
      params: { folder, id: String(id) },
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    });
  }

  uploadImageToCloudinary(file: File, config: UploadPresignedResponse): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', config.apiKey);
    formData.append('timestamp', String(config.timestamp));
    formData.append('signature', config.signature);
    formData.append('folder', config.folder);

    return fetch(`https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`, {
      method: 'POST',
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: { message?: string } };
        const message = body.error?.message ?? `Tải tệp thất bại (${res.status})`;
        throw new Error(message);
      }
      const data = (await res.json()) as { secure_url: string };
      return data.secure_url;
    });
  }

  async resizeImageFile(
    file: File,
    options?: { maxDimension?: number; outputType?: string; quality?: number },
  ): Promise<File> {
    const maxDimension = options?.maxDimension ?? 512;
    const outputType = options?.outputType ?? 'image/jpeg';
    const quality = options?.quality ?? 0.85;

    if (file.size < 800 * 1024) return file;

    const image = await this.loadImageBitmap(file);
    const { width, height } = image;

    const scale = Math.min(maxDimension / width, maxDimension / height, 1);
    if (scale === 1) return file;

    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));

    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    try {
      ctx.drawImage(image as unknown as CanvasImageSource, 0, 0, canvas.width, canvas.height);
    } finally {
      if (typeof (image as ImageBitmap | { close?: () => void }).close === 'function') {
        (image as ImageBitmap | { close?: () => void }).close?.();
      }
    }

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob((b) => resolve(b), outputType, quality));
    if (!blob) return file;

    const newExt = outputType === 'image/png' ? 'png' : outputType === 'image/webp' ? 'webp' : 'jpg';
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    return new File([blob], `${baseName}.${newExt}`, { type: outputType });
  }

  private async loadImageBitmap(file: File): Promise<ImageBitmap | { width: number; height: number }> {
    if ('createImageBitmap' in window) {
      return await createImageBitmap(file);
    }

    return await new Promise((resolve) => {
      const url = URL.createObjectURL(file);
      const img = document.createElement('img');
      img.onload = () =>
        resolve({ width: img.naturalWidth, height: img.naturalHeight } as { width: number; height: number });
      img.onerror = () => resolve({ width: 0, height: 0 });
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({ width: img.naturalWidth, height: img.naturalHeight } as { width: number; height: number });
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve({ width: 0, height: 0 });
      };
      img.src = url;
    });
  }
}
