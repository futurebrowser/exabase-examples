import type { CreateBookmarkRequestParentId } from "@exabase/sdk";
import { NextResponse } from "next/server";
import { uploadResponseSchema } from "@/lib/api/schemas";
import { getExabase } from "@/lib/exabase-server";
import { ensureWorkspaceLayout } from "@/lib/workspace-layout";

function asParentId(id: string): CreateBookmarkRequestParentId {
  return id as unknown as CreateBookmarkRequestParentId;
}

type RouteCtx = { params: Promise<{ baseId: string }> };

function isPdfUpload(file: File): boolean {
  const name = file.name?.toLowerCase() ?? "";
  const byExt = name.endsWith(".pdf");
  const byMime = file.type.trim().toLowerCase() === "application/pdf";
  return byExt || byMime;
}

export async function POST(request: Request, context: RouteCtx) {
  const { baseId } = await context.params;
  if (!baseId) {
    return NextResponse.json({ error: "Missing base" }, { status: 400 });
  }

  const form = await request.formData();

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: 'Expected "file" field' },
      { status: 400 },
    );
  }

  if (!isPdfUpload(file)) {
    return NextResponse.json(
      { error: "Only PDF files are supported." },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const size = buffer.length;
  if (size === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
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
    return NextResponse.json(
      { error: `Storage upload failed: ${putRes.status}` },
      { status: 502 },
    );
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

  const body = uploadResponseSchema.parse({
    id: created.id,
    name: created.name,
    stateProcessing: created.stateProcessing,
  });
  return NextResponse.json(body);
}
