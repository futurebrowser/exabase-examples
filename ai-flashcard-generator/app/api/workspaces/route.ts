import { NextResponse } from "next/server";
import { createBaseResponseSchema } from "@/lib/api/schemas";
import { getExabase } from "@/lib/exabase-server";
import { ensureWorkspaceLayout } from "@/lib/workspace-layout";

export async function POST() {
  const api = getExabase();
  const base = await api.bases.create({
    title: "Flashcards demo",
  });

  await ensureWorkspaceLayout(base.id);
  const body = createBaseResponseSchema.parse({
    baseId: base.id,
  });

  return NextResponse.json(body);
}
