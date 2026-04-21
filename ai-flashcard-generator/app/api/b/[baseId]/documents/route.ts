import type { ResourceDetail } from "@exabase/sdk";
import { Kind } from "@exabase/sdk";
import { NextResponse } from "next/server";
import { documentsResponseSchema } from "@/lib/api/schemas";
import { getExabase } from "@/lib/exabase-server";

function caption(r: ResourceDetail): string | null {
  if (!("data" in r)) return null;
  const block = r.data as { caption?: string | null } | null | undefined;
  return block?.caption?.trim() || null;
}

type RouteCtx = { params: Promise<{ baseId: string }> };

export async function GET(_request: Request, context: RouteCtx) {
  const { baseId } = await context.params;
  if (!baseId) {
    return NextResponse.json({ error: "Missing base" }, { status: 400 });
  }

  const api = getExabase();

  const res = await api.resources.filter(
    {
      kindExclude: [Kind.Folder, Kind.Notepad],
      limit: 80,
    },
    { baseId },
  );

  const documents = res.resources.map((r) => ({
    id: r.id,
    kind: r.kind,
    mimeType: r.mimeType,
    name: r.name,
    caption: caption(r),
    data: r.data,
    stateProcessing: r.stateProcessing,
  }));

  const body = documentsResponseSchema.parse({ documents });
  return NextResponse.json(body);
}
