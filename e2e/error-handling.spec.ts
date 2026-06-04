import { PrismaClient, type Image } from "@prisma/client";
import { expect, test } from "@playwright/test";

test("shows a clear error for unsupported upload file types", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Choose image files").setInputFiles({
    name: "not-an-image.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("not an image")
  });

  await expect(page.getByText("Unsupported image type. Use JPG, PNG, GIF, or WebP.")).toBeVisible();
});

test("shows a clear error when a selected image is missing from storage", async ({ page }) => {
  const prisma = new PrismaClient();
  const image = await createMissingObjectImage(prisma);

  try {
    await page.goto("/");
    await page.getByRole("button", { name: `Select ${image.filename}` }).click();
    await page.getByRole("button", { name: "Download zip" }).click();

    await expect(page.getByText("One or more image files are missing from storage")).toBeVisible();
  } finally {
    await prisma.image.deleteMany({
      where: {
        id: image.id
      }
    });
    await prisma.$disconnect();
  }
});

async function createMissingObjectImage(prisma: PrismaClient): Promise<Image> {
  const runId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return prisma.image.create({
    data: {
      filename: `missing-object-${runId}.png`,
      storageKey: `uploads/e2e/missing-object-${runId}.png`,
      contentType: "image/png",
      size: BigInt(1)
    }
  });
}
