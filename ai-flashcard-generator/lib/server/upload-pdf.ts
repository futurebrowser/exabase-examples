import type { CreateBookmarkRequestParentId } from "@exabase/sdk";
import "server-only";

import { uploadResponseSchema } from "@/lib/api/schemas";
import { getExabase } from "@/lib/exabase-server";
import { ensureWorkspaceLayout } from "@/lib/workspace-layout";

function asParentId(id: string): CreateBookmarkRequestParentId {
  return id as unknown as CreateBookmarkRequestParentId;
}

function isPdfUpload(file: File): boolean {
  const name = file.name?.toLowerCase() ?? "";
  const byExt = name.endsWith(".pdf");
  const byMime = file.type.trim().toLowerCase() === "application/pdf";
  return byExt || byMime;
}

export async function uploadPdfForBase(baseId: string, file: File) {
  if (!isPdfUpload(file)) {
    throw new Error("Only PDF files are supported.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const size = buffer.length;
  if (size === 0) {
    throw new Error("Empty file");
  }

  const originalName = file.name || "upload.pdf";
  const mimeType = "application/pdf";
  const uniqueName = `${crypto.randomUUID()}-${originalName.replace(/[^\w.-]+/g, "_")}`;

  const api = getExabase();
  const { spaceId } = await ensureWorkspaceLayout(baseId);

  const presigned = await api.uploads.getUrl(
    { filename: uniqueName, size },
    { baseId },
  );

  const putHeaders: Record<string, string> = {};
  const cd = presigned.headers["Content-Disposition"];
  if (cd) putHeaders["Content-Disposition"] = cd;
  const etag = presigned.headers.ETag;
  if (etag) putHeaders.ETag = etag;

  const putRes = await fetch(presigned.url, {
    method: "PUT",
    headers: putHeaders,
    body: buffer,
  });
  if (!putRes.ok) {
    console.error(
      "[upload] storage PUT failed",
      putRes.status,
      await putRes.text().catch(() => ""),
    );
    throw new Error(`Storage upload failed: ${putRes.status}`);
  }

  const path = new URL(presigned.url).pathname.replace(/^\//, "");

  const created = await api.files.create(
    {
      attachment: { path, filename: uniqueName },
      parentId: asParentId(spaceId),
      mimeType,
    },
    { baseId },
  );

  return uploadResponseSchema.parse({
    id: created.id,
    name: created.name,
    stateProcessing: created.stateProcessing,
  });
}
