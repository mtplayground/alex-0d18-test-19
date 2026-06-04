import type {
  DownloadImagesZipRequest,
  ImageMetadata,
  ListImagesResponse,
  UploadImagesResponse
} from "@myclawteam/shared";

export async function listImages(): Promise<ImageMetadata[]> {
  const response = await fetch("/api/images", {
    headers: {
      Accept: "application/json"
    }
  });

  let payload: ListImagesResponse | { error?: string };

  try {
    payload = (await response.json()) as ListImagesResponse | { error?: string };
  } catch {
    throw new Error("Image list response was not valid JSON");
  }

  if (!response.ok) {
    throw new Error("error" in payload && payload.error ? payload.error : "Failed to load images");
  }

  if (!("images" in payload)) {
    throw new Error("Image list response did not include images");
  }

  return [...payload.images].sort(
    (first, second) => new Date(second.uploadedAt).getTime() - new Date(first.uploadedAt).getTime()
  );
}

export function uploadImageFile(
  file: File,
  onProgress: (progress: number) => void
): Promise<ImageMetadata> {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append("files", file);

    const request = new XMLHttpRequest();

    request.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        return;
      }

      onProgress(Math.round((event.loaded / event.total) * 100));
    };

    request.onload = () => {
      let payload: UploadImagesResponse | { error?: string };

      try {
        payload = JSON.parse(request.responseText) as UploadImagesResponse | { error?: string };
      } catch {
        reject(new Error("Upload response was not valid JSON"));
        return;
      }

      if (request.status < 200 || request.status >= 300) {
        reject(new Error("error" in payload && payload.error ? payload.error : "Upload failed"));
        return;
      }

      if (!("images" in payload) || !payload.images[0]) {
        reject(new Error("Upload response did not include image metadata"));
        return;
      }

      resolve(payload.images[0]);
    };

    request.onerror = () => {
      reject(new Error("Network error while uploading"));
    };

    request.onabort = () => {
      reject(new Error("Upload was canceled"));
    };

    request.open("POST", "/api/uploads");
    request.send(formData);
  });
}

export async function downloadImagesZip(imageIds: string[]): Promise<void> {
  const requestBody: DownloadImagesZipRequest = { imageIds };
  const response = await fetch("/api/downloads/zip", {
    method: "POST",
    headers: {
      Accept: "application/zip",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error(await readDownloadError(response));
  }

  const zipBlob = await response.blob();
  triggerDownload(zipBlob, readFilename(response.headers) || "myclawteam-images.zip");
}

async function readDownloadError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error || "Download failed";
  } catch {
    return "Download failed";
  }
}

function readFilename(headers: Headers): string | undefined {
  const contentDisposition = headers.get("Content-Disposition");
  const match = contentDisposition?.match(/filename="?([^"]+)"?/i);
  return match?.[1];
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
