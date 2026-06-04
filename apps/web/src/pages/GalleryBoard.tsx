import { useCallback, useEffect, useState } from "react";
import type { ImageMetadata } from "@myclawteam/shared";
import { AlertCircle, RefreshCw } from "lucide-react";
import { ImageGrid } from "../components/ImageGrid";
import { UploadDropzone } from "../components/UploadDropzone";
import { listImages } from "../lib/api";

export function GalleryBoard() {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  const refreshImages = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      setImages(await listImages());
    } catch (requestError: unknown) {
      setError(requestError instanceof Error ? requestError.message : "Failed to load images");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshImages();
  }, [refreshImages]);

  const handleUploaded = (image: ImageMetadata) => {
    setImages((currentImages) => [
      image,
      ...currentImages.filter((currentImage) => currentImage.id !== image.id)
    ]);
  };

  return (
    <div className="space-y-10">
      <UploadDropzone onUploaded={handleUploaded} />

      <section className="w-full">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-normal text-ink">Gallery</h2>
            <p className="mt-1 text-sm text-slate-600">{images.length} images</p>
          </div>
          <button
            type="button"
            className="inline-flex w-fit items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-ink shadow-sm transition hover:border-meadow hover:text-meadow focus:outline-none focus:ring-4 focus:ring-meadow/15 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={() => void refreshImages()}
            disabled={loading}
          >
            <RefreshCw aria-hidden="true" size={17} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        {error ? (
          <div className="mb-5 flex items-center gap-3 rounded-lg border border-coral/30 bg-white px-4 py-3 text-sm text-coral shadow-sm">
            <AlertCircle aria-hidden="true" size={18} />
            <p>{error}</p>
          </div>
        ) : null}

        <ImageGrid images={images} loading={loading} />
      </section>
    </div>
  );
}
