import { NextResponse as NextJson } from "next/server";
import { uploadPdfForBase } from "@/lib/server/upload-pdf";

type RouteCtx = { params: Promise<{ baseId: string }> };

export async function POST(request: Request, context: RouteCtx) {
  const { baseId } = await context.params;
  if (!baseId) {
    return NextJson.json({ error: "Missing base" }, { status: 400 });
  }

  const form = await request.formData();

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextJson.json({ error: 'Expected "file" field' }, { status: 400 });
  }

  try {
    const body = await uploadPdfForBase(baseId, file);
    return NextJson.json(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    const status =
      message.startsWith("Storage upload failed") || message.includes("upload")
        ? 502
        : 400;
    return NextJson.json({ error: message }, { status });
  }
}
