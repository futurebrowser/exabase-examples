import { type UploadResponse, uploadResponseSchema } from "@/lib/api/schemas";

export async function postUpload(file: File): Promise<UploadResponse> {
  const fd = new FormData();
  fd.set("file", file);
  const res = await fetch("/api/upload", {
    method: "POST",
    body: fd,
  });
  const json: unknown = await res.json();
  if (!res.ok) {
    const message =
      typeof json === "object" &&
      json !== null &&
      "error" in json &&
      typeof json.error === "string"
        ? json.error
        : `Upload failed (${res.status})`;
    throw new Error(message);
  }
  return uploadResponseSchema.parse(json);
}

export function downloadHref(jobId: string): string {
  return `/api/jobs/${jobId}/download`;
}
