import type { Image as PrismaImage } from "@prisma/client";
import {
  ACCEPTED_IMAGE_CONTENT_TYPES,
  type AcceptedImageContentType,
  type ImageMetadata
} from "@myclawteam/shared";
import { HttpError } from "./httpError.js";

export function imageContentUrl(imageId: string): string {
  return `/api/images/${encodeURIComponent(imageId)}/content`;
}

export function toImageMetadata(image: PrismaImage): ImageMetadata {
  return {
    id: image.id,
    filename: image.filename,
    storageKey: image.storageKey,
    url: imageContentUrl(image.id),
    contentType: validateImageContentType(image.contentType),
    size: Number(image.size),
    uploadedAt: image.uploadedAt.toISOString()
  };
}

export function validateImageContentType(contentType: string): AcceptedImageContentType {
  const normalizedContentType = contentType.toLowerCase();

  if (ACCEPTED_IMAGE_CONTENT_TYPES.includes(normalizedContentType as AcceptedImageContentType)) {
    return normalizedContentType as AcceptedImageContentType;
  }

  throw new HttpError(415, `Unsupported image content type: ${contentType || "unknown"}`);
}
