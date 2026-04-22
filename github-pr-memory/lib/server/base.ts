import "server-only";

import { createBaseResponseSchema } from "@/lib/api/schemas";
import { getExabase } from "@/lib/exabase-server";

export async function createGithubPrMemoryBase(): Promise<{ baseId: string }> {
  const api = getExabase();
  const base = await api.bases.create({
    title: "GitHub PR memory demo",
  });

  return createBaseResponseSchema.parse({
    baseId: base.id,
  });
}
