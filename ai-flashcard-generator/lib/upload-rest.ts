import { uploadResponseSchema } from "@/lib/api/schemas";

export async function postUploadPdf(baseId: string, file: File) {
  const fd = new FormData();
  fd.set("file", file);
  const res = await fetch(`/api/b/${baseId}/upload`, {
    method: "POST",
    body: fd,
  });
  const json = (await res.json()) as unknown;
  if (!res.ok) {
    const err =
      json &&
      typeof json === "object" &&
      "error" in json &&
      typeof (json as { error: unknown }).error === "string"
        ? (json as { error: string }).error
        : `Upload failed (${res.status})`;
    throw new Error(err);
  }
  return uploadResponseSchema.parse(json);
}
