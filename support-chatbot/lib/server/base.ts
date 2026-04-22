import "server-only";

import { createBaseResponseSchema } from "@/lib/api/schemas";
import { getExabase } from "@/lib/exabase-server";

export async function createSalesBase(): Promise<{ baseId: string }> {
  const api = getExabase();
  const base = await api.bases.create({
    title: "Personal assistant demo",
  });

  return createBaseResponseSchema.parse({
    baseId: base.id,
  });
}
