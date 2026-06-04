import type { ImageMetadata } from "@myclawteam/shared";
import { ImageOff } from "lucide-react";

interface ImageGridProps {
  images: ImageMetadata[];
  loading: boolean;
}

export function ImageGrid({ images, loading }: ImageGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="aspect-square animate-pulse rounded-lg border border-slate-200 bg-white shadow-sm"
          />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex min-h-72 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white px-6 py-12 text-center shadow-sm">
        <ImageOff aria-hidden="true" className="text-slate-400" size={34} />
        <p className="mt-4 text-lg font-semibold text-ink">No images yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {images.map((image) => (
        <article
          key={image.id}
          className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
        >
          <div className="aspect-square bg-slate-100">
            <img
              src={image.url}
              alt={image.filename}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="space-y-1 p-3">
            <p className="truncate text-sm font-medium text-ink" title={image.filename}>
              {image.filename}
            </p>
            <p className="text-xs text-slate-500">
              {formatDate(image.uploadedAt)} · {formatBytes(image.size)}
            </p>
          </div>
        </article>
      ))}
    </div>
  );
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
