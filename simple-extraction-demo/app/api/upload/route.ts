import { NextResponse as NextJson } from "next/server";

import { createFromUploadedFile } from "@/lib/extract/service";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextJson.json({ error: 'Expected "file" field' }, { status: 400 });
  }

  try {
    const body = await createFromUploadedFile(file);
    return NextJson.json(body);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextJson.json({ error: message }, { status: 400 });
  }
}
