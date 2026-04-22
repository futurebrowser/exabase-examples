import "server-only";

import { createBaseResponseSchema } from "@/lib/api/schemas";
import { getExabase } from "@/lib/exabase-server";
import { ensureWorkspaceLayout } from "@/lib/workspace-layout";

export async function createFlashcardWorkspace(): Promise<{ baseId: string }> {
  const api = getExabase();
  const base = await api.bases.create({
    title: "Flashcards demo",
  });

  await ensureWorkspaceLayout(base.id);
  return createBaseResponseSchema.parse({
    baseId: base.id,
  });
}
