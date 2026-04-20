import { NextResponse } from "next/server";
import { createWorkspaceResponseSchema } from "@/lib/api/schemas";
import { getExabase } from "@/lib/exabase-server";
import { ensureWorkspaceLayout } from "@/lib/workspace-layout";

export async function POST() {
  const api = getExabase();
  const workspace = await api.workspaces.create({
    title: "Flashcards demo",
  });

  await ensureWorkspaceLayout(workspace.id);
  const body = createWorkspaceResponseSchema.parse({
    workspaceId: workspace.id,
  });

  return NextResponse.json(body);
}
