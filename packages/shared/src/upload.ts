export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_UPLOAD_FILES = 20;

export const ACCEPTED_IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp"
] as const;

export const ACCEPTED_IMAGE_TYPE_LABEL = "JPG, PNG, GIF, or WebP";

export type AcceptedImageContentType = (typeof ACCEPTED_IMAGE_CONTENT_TYPES)[number];

export interface ImageMetadata {
  id: string;
  filename: string;
  storageKey: string;
  url: string;
  contentType: AcceptedImageContentType;
  size: number;
  uploadedAt: string;
}

export interface ListImagesResponse {
  images: ImageMetadata[];
}

export interface UploadImagesResponse {
  images: ImageMetadata[];
}

export interface DownloadImagesZipRequest {
  imageIds: string[];
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
