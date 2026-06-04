CREATE TABLE "images" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "filename" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "content_type" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "uploaded_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "images_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "images_size_nonnegative_check" CHECK ("size" >= 0)
);

CREATE UNIQUE INDEX "images_storage_key_key" ON "images"("storage_key");
CREATE INDEX "images_uploaded_at_idx" ON "images"("uploaded_at");
