import { NextResponse } from "next/server";
import { getExabase } from "@/lib/exabase-server";

type RouteCtx = {
  params: Promise<{ baseId: string; resourceId: string }>;
};

/** GET one resource via Exabase `resources.get` — logs full payload on the server. */
export async function GET(_request: Request, context: RouteCtx) {
  const { baseId, resourceId } = await context.params;
  if (!baseId || !resourceId) {
    return NextResponse.json(
      { error: "Missing base or resource id" },
      { status: 400 },
    );
  }

  const api = getExabase();
  const detail = await api.resources.get({ resourceId }, { baseId });

  return NextResponse.json(detail);
}
