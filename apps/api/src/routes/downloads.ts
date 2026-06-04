import { createRequire } from "node:module";
import { basename } from "node:path";
import type { Image, PrismaClient } from "@prisma/client";
import type { DownloadImagesZipRequest } from "@myclawteam/shared";
import { Router } from "express";
import { HttpError } from "../lib/httpError.js";
import {
  objectBodyToReadable,
  type ObjectStorageClient,
  type RetrievedStoredObject
} from "../storage/objectStorage.js";

interface DownloadsRouterDependencies {
  prisma: PrismaClient;
  storage: ObjectStorageClient;
}

interface ZipEntry {
  image: Image;
  object: RetrievedStoredObject;
}

interface ZipArchive extends NodeJS.ReadWriteStream {
  append(source: NodeJS.ReadableStream | Buffer | string, data: { name: string }): this;
  finalize(): Promise<void>;
  destroy(error?: Error): this;
}

const MAX_ZIP_IMAGES = 100;
const require = createRequire(import.meta.url);
const archiver = require("archiver") as {
  ZipArchive: new (options: { zlib: { level: number } }) => ZipArchive;
};

export function createDownloadsRouter(dependencies: DownloadsRouterDependencies): Router {
  const router = Router();

  router.post("/downloads/zip", async (request, response, next) => {
    try {
      const imageIds = readImageIds(request.body);
      const images = await loadImagesByRequestedOrder(dependencies.prisma, imageIds);
      const entries = await loadObjects(dependencies.storage, images);

      response.status(200);
      response.setHeader("Content-Type", "application/zip");
      response.setHeader("Content-Disposition", `attachment; filename="myclawteam-images.zip"`);
      response.setHeader("Cache-Control", "no-store");

      const archive = new archiver.ZipArchive({
        zlib: {
          level: 9
        }
      });

      archive.on("error", (error) => {
        response.destroy(error);
      });
      archive.pipe(response);

      entries.forEach((entry, index) => {
        const stream = objectBodyToReadable(entry.object.body);
        stream.on("error", (error) => {
          archive.destroy(error);
        });
        archive.append(stream, {
          name: zipEntryName(entry.image, index)
        });
      });

      await archive.finalize();
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function readImageIds(body: unknown): string[] {
  if (!isDownloadRequest(body)) {
    throw new HttpError(400, "Request body must include imageIds");
  }

  const imageIds = [...new Set(body.imageIds.map((imageId) => imageId.trim()))].filter(Boolean);

  if (imageIds.length === 0) {
    throw new HttpError(400, "At least one image ID is required");
  }

  if (imageIds.length > MAX_ZIP_IMAGES) {
    throw new HttpError(413, `Zip download accepts at most ${MAX_ZIP_IMAGES} images`);
  }

  return imageIds;
}

function isDownloadRequest(body: unknown): body is DownloadImagesZipRequest {
  if (!body || typeof body !== "object" || !("imageIds" in body)) {
    return false;
  }

  const imageIds = (body as { imageIds: unknown }).imageIds;
  return Array.isArray(imageIds) && imageIds.every((imageId) => typeof imageId === "string");
}

async function loadImagesByRequestedOrder(
  prisma: PrismaClient,
  imageIds: string[]
): Promise<Image[]> {
  const images = await prisma.image.findMany({
    where: {
      id: {
        in: imageIds
      }
    }
  });
  const imagesById = new Map(images.map((image) => [image.id, image]));
  const missingImageIds = imageIds.filter((imageId) => !imagesById.has(imageId));

  if (missingImageIds.length > 0) {
    throw new HttpError(404, "One or more images were not found");
  }

  return imageIds.map((imageId) => imagesById.get(imageId) as Image);
}

async function loadObjects(storage: ObjectStorageClient, images: Image[]): Promise<ZipEntry[]> {
  const entries: ZipEntry[] = [];

  for (const image of images) {
    entries.push({
      image,
      object: await storage.getObject(image.storageKey)
    });
  }

  return entries;
}

function zipEntryName(image: Image, index: number): string {
  const safeFilename =
    basename(image.filename.replaceAll("\\", "/"))
      .normalize("NFKD")
      .replace(/[^\w.-]+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || "image";

  return `${String(index + 1).padStart(3, "0")}-${safeFilename}`;
}
