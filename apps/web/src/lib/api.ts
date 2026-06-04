import type { ImageMetadata, UploadImagesResponse } from "@myclawteam/shared";

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
