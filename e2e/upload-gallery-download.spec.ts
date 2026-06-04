import { execFile } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { PrismaClient, type Image } from "@prisma/client";
import { expect, test } from "@playwright/test";

const execFileAsync = promisify(execFile);
const pngBytes = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMB/6X+X8sAAAAASUVORK5CYII=",
  "base64"
);

test("upload, display, select, and download selected images as a valid zip", async ({
  page
}, testInfo) => {
  const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  const filenames = [`e2e-${runId}-a.png`, `e2e-${runId}-b.png`];
  const filePaths = [testInfo.outputPath(filenames[0]), testInfo.outputPath(filenames[1])];

  await Promise.all(filePaths.map((filePath) => writeFile(filePath, pngBytes)));

  try {
    await page.goto("/");
    await page.getByLabel("Choose image files").setInputFiles(filePaths);

    await expect(page.getByRole("button", { name: `Select ${filenames[0]}` })).toBeVisible();
    await expect(page.getByRole("button", { name: `Select ${filenames[1]}` })).toBeVisible();

    await page.getByRole("button", { name: `Select ${filenames[0]}` }).click();
    await expect(page.getByText(/1 selected/)).toBeVisible();

    const downloadPromise = page.waitForEvent("download");
    await page.getByRole("button", { name: "Download zip" }).click();
    const download = await downloadPromise;
    const zipPath = await download.path();

    if (!zipPath) {
      throw new Error("Downloaded zip path was not available");
    }

    const { stdout } = await execFileAsync("unzip", ["-l", zipPath]);
    expect(stdout).toContain(`001-${filenames[0]}`);
    expect(stdout).not.toContain(filenames[1]);

    await execFileAsync("unzip", ["-t", zipPath]);
  } finally {
    await cleanupImages(filenames);
  }
});

async function cleanupImages(filenames: string[]) {
  const prisma = new PrismaClient();

  try {
    const images = await prisma.image.findMany({
      where: {
        filename: {
          in: filenames
        }
      }
    });

    const s3 = createS3Client();

    for (const image of images) {
      await deleteObject(s3, image);
      await prisma.image.delete({
        where: {
          id: image.id
        }
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}

function createS3Client(): S3Client {
  return new S3Client({
    endpoint: readRequiredEnv("OBJECT_STORAGE_ENDPOINT"),
    region: readRequiredEnv("OBJECT_STORAGE_REGION"),
    forcePathStyle: readRequiredEnv("OBJECT_STORAGE_FORCE_PATH_STYLE") === "true",
    credentials: {
      accessKeyId: readRequiredEnv("OBJECT_STORAGE_ACCESS_KEY_ID"),
      secretAccessKey: readRequiredEnv("OBJECT_STORAGE_SECRET_ACCESS_KEY")
    }
  });
}

async function deleteObject(s3: S3Client, image: Image) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: readRequiredEnv("OBJECT_STORAGE_BUCKET"),
      Key: readRequiredEnv("OBJECT_STORAGE_PREFIX") + image.storageKey
    })
  );
}

function readRequiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
