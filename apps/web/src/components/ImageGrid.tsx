import type { ImageMetadata } from "@myclawteam/shared";
import { CheckSquare2, ImageOff, Square } from "lucide-react";

interface ImageGridProps {
  images: ImageMetadata[];
  loading: boolean;
  selectedIds: Set<string>;
  onToggleSelection: (imageId: string) => void;
}

export function ImageGrid({ images, loading, selectedIds, onToggleSelection }: ImageGridProps) {
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
        <article key={image.id}>
          <button
            type="button"
            className={[
              "block w-full overflow-hidden rounded-lg border bg-white text-left shadow-sm transition focus:outline-none focus:ring-4 focus:ring-meadow/15",
              selectedIds.has(image.id)
                ? "border-meadow ring-2 ring-meadow/25"
                : "border-slate-200 hover:border-meadow"
            ].join(" ")}
            aria-pressed={selectedIds.has(image.id)}
            aria-label={`${selectedIds.has(image.id) ? "Clear" : "Select"} ${image.filename}`}
            onClick={() => {
              onToggleSelection(image.id);
            }}
          >
            <div className="relative aspect-square bg-slate-100">
              <img
                src={image.url}
                alt={image.filename}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <span className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-md bg-white/95 text-ink shadow-sm">
                {selectedIds.has(image.id) ? (
                  <CheckSquare2 aria-hidden="true" size={18} className="text-meadow" />
                ) : (
                  <Square aria-hidden="true" size={18} className="text-slate-500" />
                )}
              </span>
            </div>
            <div className="space-y-1 p-3">
              <p className="truncate text-sm font-medium text-ink" title={image.filename}>
                {image.filename}
              </p>
              <p className="text-xs text-slate-500">
                {formatDate(image.uploadedAt)} · {formatBytes(image.size)}
              </p>
            </div>
          </button>
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
