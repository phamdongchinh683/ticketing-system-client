import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { constant } from '../../constants';
import { UploadPresignedResponse } from '../../interfaces/upload';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private readonly http: HttpClient) {}

  getPresigned(folder: string, id: number): Observable<UploadPresignedResponse> {
    return this.http.get<UploadPresignedResponse>(`${constant.baseUrl}/upload/super-admin/presigned`, {
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
        const message = body.error?.message ?? `Upload failed (${res.status})`;
        throw new Error(message);
      }
      const data = (await res.json()) as { secure_url: string };
      return data.secure_url;
    });
  }
}
