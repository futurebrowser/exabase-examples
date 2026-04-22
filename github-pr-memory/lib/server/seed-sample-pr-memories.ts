import "server-only";

import { getExabase } from "@/lib/exabase-server";
import { SAMPLE_PR_MEMORIES } from "@/lib/sample-pr-memories";

export async function seedSamplePrMemories(
  baseId: string,
): Promise<{ created: number }> {
  const api = getExabase();
  const scope = { baseId };

  for (const content of SAMPLE_PR_MEMORIES) {
    await api.memories.create(
      {
        source: "text",
        content,
        infer: false,
      },
      scope,
    );
  }

  return { created: SAMPLE_PR_MEMORIES.length };
}
