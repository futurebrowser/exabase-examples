import "server-only";

import { getExabase } from "@/lib/exabase-server";
import { SAMPLE_PERSONAL_MEMORIES } from "@/lib/sample-personal-memories";

export async function seedSamplePersonalMemories(
  baseId: string,
): Promise<{ created: number }> {
  const api = getExabase();
  const scope = { baseId };

  for (const content of SAMPLE_PERSONAL_MEMORIES) {
    await api.memories.create(
      {
        source: "text",
        content,
        infer: false,
      },
      scope,
    );
  }

  return { created: SAMPLE_PERSONAL_MEMORIES.length };
}
