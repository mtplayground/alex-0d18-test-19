import { Readable } from "node:stream";
import type { ReadableStream as NodeReadableStream } from "node:stream/web";
import type { PrismaClient } from "@prisma/client";
import type { ListImagesResponse } from "@myclawteam/shared";
import { Router, type Response } from "express";
import { HttpError } from "../lib/httpError.js";
import { toImageMetadata } from "../lib/imageMetadata.js";
import type { ObjectStorageClient, RetrievedStoredObject } from "../storage/objectStorage.js";

interface ImagesRouterDependencies {
  prisma: PrismaClient;
  storage: ObjectStorageClient;
}

export function createImagesRouter(dependencies: ImagesRouterDependencies): Router {
  const router = Router();

  router.get("/images", async (_request, response: Response<ListImagesResponse>, next) => {
    try {
      const images = await dependencies.prisma.image.findMany({
        orderBy: {
          uploadedAt: "desc"
        }
      });

      response.status(200).json({ images: images.map(toImageMetadata) });
    } catch (error) {
      next(error);
    }
  });

  router.get("/images/:id/content", async (request, response, next) => {
    try {
      const image = await dependencies.prisma.image.findUnique({
        where: {
          id: request.params.id
        }
      });

      if (!image) {
        throw new HttpError(404, "Image not found");
      }

      const object = await dependencies.storage.getObject(image.storageKey);

      response.status(200);
      response.setHeader("Content-Type", image.contentType);
      response.setHeader("Content-Length", image.size.toString());
      response.setHeader("Cache-Control", "private, max-age=300");
      response.setHeader(
        "Content-Disposition",
        `inline; filename="${escapeFilename(image.filename)}"`
      );

      streamObjectBody(object, response);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

function streamObjectBody(object: RetrievedStoredObject, response: Response) {
  if (object.body instanceof Readable) {
    object.body.on("error", (error) => {
      response.destroy(error);
    });
    object.body.pipe(response);
    return;
  }

  if ("transformToWebStream" in object.body) {
    const stream = Readable.fromWeb(object.body.transformToWebStream() as NodeReadableStream);
    stream.on("error", (error) => {
      response.destroy(error);
    });
    stream.pipe(response);
    return;
  }

  throw new HttpError(500, "Object body is not streamable");
}

function escapeFilename(filename: string): string {
  return filename.replace(/["\\]/g, "_");
}
