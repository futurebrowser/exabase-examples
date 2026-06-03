import { NextResponse as NextJson } from "next/server";

import { downloadAttachments } from "@/lib/extract/service";

type RouteCtx = { params: Promise<{ jobId: string }> };

export async function GET(_request: Request, context: RouteCtx) {
  const { jobId } = await context.params;
  if (!jobId) {
    return NextJson.json({ error: "Missing job" }, { status: 400 });
  }

  try {
    const blob = await downloadAttachments(jobId);
    return new Response(blob, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="extract-${jobId}.zip"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Download failed";
    return NextJson.json({ error: message }, { status: 400 });
  }
}
