export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
export const MAX_UPLOAD_FILES = 20;

export const ACCEPTED_IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp"
] as const;

export type AcceptedImageContentType = (typeof ACCEPTED_IMAGE_CONTENT_TYPES)[number];

export interface ImageMetadata {
  id: string;
  filename: string;
  storageKey: string;
  contentType: AcceptedImageContentType;
  size: number;
  uploadedAt: string;
}

export interface UploadImagesResponse {
  images: ImageMetadata[];
}
