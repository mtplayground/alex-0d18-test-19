import { randomUUID } from "node:crypto";
import { basename, extname } from "node:path";
import { PassThrough } from "node:stream";
import type { PrismaClient, Image as PrismaImage } from "@prisma/client";
import {
  ACCEPTED_IMAGE_CONTENT_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_UPLOAD_FILES,
  type AcceptedImageContentType,
  type ImageMetadata,
  type UploadImagesResponse
} from "@myclawteam/shared";
import Busboy from "busboy";
import { Router, type Request, type Response } from "express";
import { HttpError } from "../lib/httpError.js";
import type { ObjectStorageClient } from "../storage/objectStorage.js";

interface UploadRouterDependencies {
  prisma: PrismaClient;
  storage: ObjectStorageClient;
}

interface FileInfo {
  filename: string;
  mimeType: string;
}

const CONTENT_TYPE_EXTENSIONS: Record<AcceptedImageContentType, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp"
};

export function createUploadsRouter(dependencies: UploadRouterDependencies): Router {
  const router = Router();

  router.post(
    "/uploads",
    async (request: Request, response: Response<UploadImagesResponse>, next) => {
      try {
        const images = await handleMultipartUpload(request, dependencies);
        response.status(201).json({ images });
      } catch (error) {
        next(error);
      }
    }
  );

  return router;
}

async function handleMultipartUpload(
  request: Request,
  dependencies: UploadRouterDependencies
): Promise<ImageMetadata[]> {
  if (!request.is("multipart/form-data")) {
    throw new HttpError(415, "Expected multipart/form-data upload");
  }

  return new Promise((resolve, reject) => {
    const uploads: Array<Promise<ImageMetadata>> = [];
    const busboy = Busboy({
      headers: request.headers,
      limits: {
        fileSize: MAX_IMAGE_SIZE_BYTES,
        files: MAX_UPLOAD_FILES
      }
    });
    let fileCount = 0;
    let settled = false;

    function rejectOnce(error: unknown) {
      if (settled) {
        return;
      }

      settled = true;
      reject(error);
    }

    function trackUpload(upload: Promise<ImageMetadata>) {
      uploads.push(upload);
      upload.catch(() => undefined);
    }

    busboy.on("file", (_fieldName, file, info: FileInfo) => {
      fileCount += 1;

      let contentType: AcceptedImageContentType;
      try {
        contentType = validateContentType(info.mimeType);
      } catch (error) {
        file.resume();
        rejectOnce(error);
        return;
      }

      const upload = uploadFile(file, info.filename, contentType, dependencies);
      trackUpload(upload);
    });

    busboy.on("filesLimit", () => {
      rejectOnce(new HttpError(413, `Upload accepts at most ${MAX_UPLOAD_FILES} files`));
    });

    busboy.on("error", rejectOnce);

    busboy.on("finish", () => {
      if (settled) {
        return;
      }

      if (fileCount === 0) {
        rejectOnce(new HttpError(400, "Upload requires at least one image file"));
        return;
      }

      Promise.all(uploads).then(resolve).catch(rejectOnce);
    });

    request.pipe(busboy);
  });
}

async function uploadFile(
  file: NodeJS.ReadableStream,
  filename: string,
  contentType: AcceptedImageContentType,
  dependencies: UploadRouterDependencies
): Promise<ImageMetadata> {
  const passThrough = new PassThrough();
  const storageKey = buildStorageKey(filename, contentType);
  let size = 0;
  let sizeLimitExceeded = false;

  file.on("data", (chunk: Buffer) => {
    size += chunk.length;
  });

  file.on("limit", () => {
    sizeLimitExceeded = true;
    passThrough.destroy(
      new HttpError(413, `Image exceeds the ${MAX_IMAGE_SIZE_BYTES} byte upload limit`)
    );
  });

  file.pipe(passThrough);

  try {
    await dependencies.storage.putObject({
      key: storageKey,
      body: passThrough,
      contentType
    });
  } catch (error) {
    if (sizeLimitExceeded) {
      throw new HttpError(413, `Image exceeds the ${MAX_IMAGE_SIZE_BYTES} byte upload limit`);
    }

    throw error;
  }

  if (sizeLimitExceeded) {
    throw new HttpError(413, `Image exceeds the ${MAX_IMAGE_SIZE_BYTES} byte upload limit`);
  }

  const image = await dependencies.prisma.image.create({
    data: {
      filename: normalizeFilename(filename),
      storageKey,
      contentType,
      size: BigInt(size)
    }
  });

  return toImageMetadata(image);
}

function validateContentType(contentType: string): AcceptedImageContentType {
  const normalizedContentType = contentType.toLowerCase();

  if (ACCEPTED_IMAGE_CONTENT_TYPES.includes(normalizedContentType as AcceptedImageContentType)) {
    return normalizedContentType as AcceptedImageContentType;
  }

  throw new HttpError(415, `Unsupported image content type: ${contentType || "unknown"}`);
}

function buildStorageKey(filename: string, contentType: AcceptedImageContentType): string {
  const now = new Date();
  const year = String(now.getUTCFullYear());
  const month = String(now.getUTCMonth() + 1).padStart(2, "0");
  const day = String(now.getUTCDate()).padStart(2, "0");
  const safeFilename = ensureImageExtension(normalizeFilename(filename), contentType);

  return `uploads/${year}/${month}/${day}/${randomUUID()}-${safeFilename}`;
}

function normalizeFilename(filename: string): string {
  const name = basename(filename.replaceAll("\\", "/"))
    .normalize("NFKD")
    .replace(/[^\w.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return name || "image";
}

function ensureImageExtension(filename: string, contentType: AcceptedImageContentType): string {
  const expectedExtension = CONTENT_TYPE_EXTENSIONS[contentType];
  const currentExtension = extname(filename).toLowerCase();

  if (currentExtension === expectedExtension) {
    return filename;
  }

  return `${filename.replace(/\.[^.]*$/, "")}${expectedExtension}`;
}

function toImageMetadata(image: PrismaImage): ImageMetadata {
  return {
    id: image.id,
    filename: image.filename,
    storageKey: image.storageKey,
    contentType: validateContentType(image.contentType),
    size: Number(image.size),
    uploadedAt: image.uploadedAt.toISOString()
  };
}
