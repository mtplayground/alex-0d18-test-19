import { useCallback, useRef, useState, type DragEvent } from "react";
import {
  ACCEPTED_IMAGE_CONTENT_TYPES,
  MAX_IMAGE_SIZE_BYTES,
  MAX_UPLOAD_FILES,
  type ImageMetadata
} from "@myclawteam/shared";
import { AlertCircle, CheckCircle2, ImagePlus, Loader2, UploadCloud, XCircle } from "lucide-react";
import { uploadImageFile } from "../lib/api";

type UploadStatus = "queued" | "uploading" | "complete" | "error";

interface UploadItem {
  id: string;
  file: File;
  progress: number;
  status: UploadStatus;
  error: string | undefined;
  image: ImageMetadata | undefined;
}

const acceptedContentTypes = new Set<string>(ACCEPTED_IMAGE_CONTENT_TYPES);
const fileInputAccept = ACCEPTED_IMAGE_CONTENT_TYPES.join(",");

interface UploadDropzoneProps {
  onUploaded?: (image: ImageMetadata) => void;
}

export function UploadDropzone({ onUploaded }: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [items, setItems] = useState<UploadItem[]>([]);
  const [dragActive, setDragActive] = useState(false);

  const updateItem = useCallback((id: string, patch: Partial<UploadItem>) => {
    setItems((currentItems) =>
      currentItems.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }, []);

  const startUpload = useCallback(
    (item: UploadItem) => {
      updateItem(item.id, { status: "uploading", progress: 1 });

      uploadImageFile(item.file, (progress) => {
        updateItem(item.id, { progress });
      })
        .then((image) => {
          onUploaded?.(image);
          updateItem(item.id, {
            status: "complete",
            progress: 100,
            image,
            error: undefined
          });
        })
        .catch((error: unknown) => {
          updateItem(item.id, {
            status: "error",
            error: error instanceof Error ? error.message : "Upload failed"
          });
        });
    },
    [onUploaded, updateItem]
  );

  const queueFiles = useCallback(
    (fileList: FileList | File[]) => {
      const files = Array.from(fileList);
      const selectedFiles = files.slice(0, MAX_UPLOAD_FILES);
      const overflowFiles = files.slice(MAX_UPLOAD_FILES);
      const nextItems = [
        ...selectedFiles.map(createUploadItem),
        ...overflowFiles.map(createLimitItem)
      ];

      setItems((currentItems) => [...nextItems, ...currentItems]);
      nextItems.forEach((item) => {
        if (item.status === "queued") {
          startUpload(item);
        }
      });
    },
    [startUpload]
  );

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setDragActive(false);
    queueFiles(event.dataTransfer.files);
  };

  const activeUploads = items.filter((item) => item.status === "uploading").length;
  const completeUploads = items.filter((item) => item.status === "complete").length;
  const failedUploads = items.filter((item) => item.status === "error").length;

  return (
    <section className="w-full">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-meadow">myClawTeam</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">Upload images</h1>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm">
          <Metric label="Active" value={activeUploads} />
          <Metric label="Done" value={completeUploads} />
          <Metric label="Errors" value={failedUploads} />
        </div>
      </div>

      <label
        className={[
          "mt-8 flex min-h-64 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed bg-white px-6 py-10 text-center shadow-sm transition",
          dragActive
            ? "border-meadow ring-4 ring-meadow/15"
            : "border-slate-300 hover:border-meadow"
        ].join(" ")}
        onDragEnter={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragActive(false);
        }}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept={fileInputAccept}
          multiple
          className="sr-only"
          aria-label="Choose image files"
          onChange={(event) => {
            if (event.target.files) {
              queueFiles(event.target.files);
              event.target.value = "";
            }
          }}
        />
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-meadow text-white">
          <UploadCloud aria-hidden="true" size={30} strokeWidth={2.2} />
        </div>
        <div className="mt-5 space-y-2">
          <p className="text-xl font-semibold text-ink">Drop images</p>
          <p className="text-sm text-slate-600">
            JPG, PNG, GIF, or WebP up to {formatBytes(MAX_IMAGE_SIZE_BYTES)}
          </p>
        </div>
        <button
          type="button"
          className="mt-6 inline-flex items-center gap-2 rounded-md bg-ink px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-ink/20"
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus aria-hidden="true" size={18} />
          Choose files
        </button>
      </label>

      {items.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="divide-y divide-slate-200">
            {items.map((item) => (
              <UploadRow key={item.id} item={item} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 text-right shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function UploadRow({ item }: { item: UploadItem }) {
  const statusLabel = getStatusLabel(item);

  return (
    <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_160px] sm:items-center">
      <div className="min-w-0">
        <div className="flex items-start gap-3">
          <StatusIcon status={item.status} />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-ink">{item.file.name}</p>
            <p className="mt-1 text-sm text-slate-500">
              {formatBytes(item.file.size)} · {statusLabel}
            </p>
            {item.error ? <p className="mt-2 text-sm text-coral">{item.error}</p> : null}
          </div>
        </div>
      </div>
      <div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className={[
              "h-full rounded-full transition-all",
              item.status === "error" ? "bg-coral" : "bg-meadow"
            ].join(" ")}
            style={{ width: `${item.status === "error" ? 100 : item.progress}%` }}
          />
        </div>
        <p className="mt-2 text-right text-sm tabular-nums text-slate-500">
          {item.status === "error" ? "Failed" : `${item.progress}%`}
        </p>
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: UploadStatus }) {
  if (status === "complete") {
    return <CheckCircle2 className="mt-0.5 shrink-0 text-meadow" size={22} aria-hidden="true" />;
  }

  if (status === "error") {
    return <XCircle className="mt-0.5 shrink-0 text-coral" size={22} aria-hidden="true" />;
  }

  if (status === "uploading") {
    return (
      <Loader2 className="mt-0.5 shrink-0 animate-spin text-meadow" size={22} aria-hidden="true" />
    );
  }

  return <AlertCircle className="mt-0.5 shrink-0 text-slate-400" size={22} aria-hidden="true" />;
}

function getStatusLabel(item: UploadItem): string {
  if (item.status === "complete") {
    return "Uploaded";
  }

  if (item.status === "error") {
    return "Error";
  }

  if (item.status === "uploading") {
    return "Uploading";
  }

  return "Queued";
}

function createUploadItem(file: File): UploadItem {
  const error = validateFile(file);
  const item: UploadItem = {
    id: createId(),
    file,
    progress: error ? 100 : 0,
    status: error ? "error" : "queued",
    error,
    image: undefined
  };

  return item;
}

function createLimitItem(file: File): UploadItem {
  return {
    id: createId(),
    file,
    progress: 100,
    status: "error",
    error: `Only ${MAX_UPLOAD_FILES} files can be queued at once`,
    image: undefined
  };
}

function validateFile(file: File): string | undefined {
  if (!acceptedContentTypes.has(file.type)) {
    return "Unsupported image type";
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return `File is larger than ${formatBytes(MAX_IMAGE_SIZE_BYTES)}`;
  }

  return undefined;
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

function createId(): string {
  if (window.crypto.randomUUID) {
    return window.crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
