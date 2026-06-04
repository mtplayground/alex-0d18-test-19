import { useCallback, useEffect, useState } from "react";
import type { ImageMetadata } from "@myclawteam/shared";
import { AlertCircle, CheckSquare2, Download, RefreshCw, SquareX } from "lucide-react";
import { ImageGrid } from "../components/ImageGrid";
import { UploadDropzone } from "../components/UploadDropzone";
import { downloadImagesZip, listImages } from "../lib/api";

export function GalleryBoard() {
  const [images, setImages] = useState<ImageMetadata[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const refreshImages = useCallback(async () => {
    setLoading(true);
    setError(undefined);

    try {
      const nextImages = await listImages();
      setImages(nextImages);
      setSelectedIds((currentSelectedIds) => {
        const nextImageIds = new Set(nextImages.map((image) => image.id));
        return new Set([...currentSelectedIds].filter((imageId) => nextImageIds.has(imageId)));
      });
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

  const toggleSelection = (imageId: string) => {
    setSelectedIds((currentSelectedIds) => {
      const nextSelectedIds = new Set(currentSelectedIds);

      if (nextSelectedIds.has(imageId)) {
        nextSelectedIds.delete(imageId);
      } else {
        nextSelectedIds.add(imageId);
      }

      return nextSelectedIds;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(images.map((image) => image.id)));
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleDownloadZip = async () => {
    if (selectedIds.size === 0) {
      setError("Select at least one image to download.");
      return;
    }

    setDownloading(true);
    setError(undefined);

    try {
      await downloadImagesZip([...selectedIds]);
    } catch (downloadError: unknown) {
      setError(downloadError instanceof Error ? downloadError.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  };

  const allSelected = images.length > 0 && images.every((image) => selectedIds.has(image.id));

  return (
    <div className="space-y-10">
      <UploadDropzone onUploaded={handleUploaded} />

      <section className="w-full">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-normal text-ink">Gallery</h2>
            <p className="mt-1 text-sm text-slate-600">
              {images.length} images · {selectedIds.size} selected
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-ink shadow-sm transition hover:border-meadow hover:text-meadow focus:outline-none focus:ring-4 focus:ring-meadow/15 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={allSelected ? clearSelection : selectAll}
              disabled={images.length === 0 || loading}
            >
              {allSelected ? (
                <SquareX aria-hidden="true" size={17} />
              ) : (
                <CheckSquare2 aria-hidden="true" size={17} />
              )}
              {allSelected ? "Clear" : "Select all"}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md bg-ink px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-ink/20 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => void handleDownloadZip()}
              disabled={selectedIds.size === 0 || downloading}
            >
              <Download aria-hidden="true" size={17} />
              {downloading ? "Downloading" : "Download zip"}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-ink shadow-sm transition hover:border-meadow hover:text-meadow focus:outline-none focus:ring-4 focus:ring-meadow/15 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => void refreshImages()}
              disabled={loading}
            >
              <RefreshCw aria-hidden="true" size={17} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {error ? (
          <div className="mb-5 flex items-center gap-3 rounded-lg border border-coral/30 bg-white px-4 py-3 text-sm text-coral shadow-sm">
            <AlertCircle aria-hidden="true" size={18} />
            <p>{error}</p>
          </div>
        ) : null}

        <ImageGrid
          images={images}
          loading={loading}
          selectedIds={selectedIds}
          onToggleSelection={toggleSelection}
        />
      </section>
    </div>
  );
}
