import type { ProcessingState, ResourceDetail } from "@exabase/sdk";
import { Kind } from "@exabase/sdk";
import { NextResponse } from "next/server";
import { documentsResponseSchema } from "@/lib/api/schemas";
import { getExabase } from "@/lib/exabase-server";

function processingState(r: ResourceDetail): ProcessingState | null {
  if ("stateProcessing" in r) return r.stateProcessing;
  return null;
}

function mimeType(r: ResourceDetail): string | null {
  if ("mimeType" in r) return r.mimeType;
  return null;
}

function caption(r: ResourceDetail): string | null {
  if (!("data" in r)) return null;
  const block = r.data as { caption?: string | null } | null | undefined;
  return block?.caption?.trim() || null;
}

type RouteCtx = { params: Promise<{ workspaceId: string }> };

export async function GET(_request: Request, context: RouteCtx) {
  const { workspaceId } = await context.params;
  if (!workspaceId) {
    return NextResponse.json({ error: "Missing workspace" }, { status: 400 });
  }

  const api = getExabase();

  const res = await api.resources.filter(
    {
      kindExclude: [Kind.Folder, Kind.Notepad],
      limit: 80,
    },
    { workspaceId },
  );

  const documents = res.resources.map((r) => ({
    id: r.id,
    kind: r.kind,
    mimeType: mimeType(r),
    name: r.name,
    caption: caption(r),
    stateProcessing: processingState(r),
  }));

  const body = documentsResponseSchema.parse({ documents });
  return NextResponse.json(body);
}
