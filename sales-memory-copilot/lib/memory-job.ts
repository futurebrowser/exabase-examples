import type { Exabase, MemoryJob } from "@exabase/sdk";

const scope = (baseId: string) => ({ baseId });

export async function memoryIdFromCreateJob(
  api: Exabase,
  job: MemoryJob,
  baseId: string,
): Promise<string> {
  let current: MemoryJob = job;
  for (let attempt = 0; attempt < 60; attempt++) {
    if ("memories" in current && current.memories?.created?.length) {
      const id = current.memories.created[0];
      if (id) return id;
    }
    if (current.status !== "pending") {
      break;
    }
    await new Promise((r) => setTimeout(r, 300));
    current = await api.memories.getJob({ jobId: current.id }, scope(baseId));
  }
  throw new Error("Memory creation did not return a memory id");
}
