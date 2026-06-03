import "server-only";

import type { ExtractJobDto } from "@/lib/api/schemas";
import { getExabase } from "@/lib/exabase-server";
import { toExtractJobDto } from "@/lib/extract/map";

export async function createFromUrl(
  url: string,
  name?: string,
): Promise<ExtractJobDto> {
  // Depends on the SDK create() fix that accepts a JSON { url } body.
  const job = await getExabase().extract.create({ url, name });
  return toExtractJobDto(job);
}
