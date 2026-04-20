import { NextResponse } from "next/server";
import { getExabase } from "@/lib/exabase-server";

type RouteCtx = {
  params: Promise<{ workspaceId: string; resourceId: string }>;
};

/** GET one resource via Exabase `resources.get` — logs full payload on the server. */
export async function GET(_request: Request, context: RouteCtx) {
  const { workspaceId, resourceId } = await context.params;
  if (!workspaceId || !resourceId) {
    return NextResponse.json(
      { error: "Missing workspace or resource id" },
      { status: 400 },
    );
  }

  const api = getExabase();
  const detail = await api.resources.get({ resourceId }, { workspaceId });

  return NextResponse.json(detail);
}
