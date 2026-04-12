export interface UploadPresignedResponse {
  acceptedMimeTypes: string[];
  allowedFormats: string;
  apiKey: string;
  cloudName: string;
  folder: string;
  timestamp: number;
  signature: string;
  uploadPreset: string;
}
