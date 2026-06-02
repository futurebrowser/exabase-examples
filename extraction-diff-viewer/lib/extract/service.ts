import "server-only";

import {
  type ExtractChunksDto,
  type ExtractJobDto,
  extractChunksDtoSchema,
} from "@/lib/api/schemas";
import { getExabase } from "@/lib/exabase-server";
import { toChunkDto, toExtractJobDto } from "@/lib/extract/map";

const CHUNK_WINDOW = 20;

export async function createFromUploadedFile(
  file: File,
): Promise<ExtractJobDto> {
  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length === 0) throw new Error("Empty file");
  const name = file.name || "upload";

  const job = await getExabase().extract.createFromFile({ file: buffer, name });
  return toExtractJobDto(job);
}

export async function getJob(jobId: string): Promise<ExtractJobDto> {
  const job = await getExabase().extract.get({ jobId });
  return toExtractJobDto(job);
}

export async function getChunks(
  jobId: string,
  start: number,
): Promise<ExtractChunksDto> {
  const res = await getExabase().extract.getChunks({
    jobId,
    start,
    end: start + CHUNK_WINDOW - 1,
  });
  return extractChunksDtoSchema.parse({ items: res.items.map(toChunkDto) });
}

export async function getAllChunkText(jobId: string): Promise<string> {
  const texts: string[] = [];
  let start = 1;
  while (true) {
    const page = await getChunks(jobId, start);
    for (const chunk of page.items) {
      texts.push(chunk.text);
    }
    if (page.items.length < CHUNK_WINDOW) break;
    start += CHUNK_WINDOW;
  }
  return texts.join("\n");
}
