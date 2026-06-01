import "server-only";

import {
  type ExtractChunksDto,
  type ExtractJobDto,
  type ExtractJobList,
  extractChunksDtoSchema,
  extractJobListSchema,
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

export async function listJobs(cursor?: string): Promise<ExtractJobList> {
  const res = await getExabase().extract.list({ limit: 25, cursor });
  return extractJobListSchema.parse({
    items: res.items.map(toExtractJobDto),
    nextCursor: res.nextCursor,
  });
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

export async function reprocessJob(jobId: string): Promise<void> {
  await getExabase().extract.reprocess({ jobId });
}

/** Returns the ZIP of all attachments for a job. */
export async function downloadAttachments(jobId: string): Promise<Blob> {
  return getExabase().extract.downloadAttachments({ jobId });
}

export const CHUNK_WINDOW_SIZE = CHUNK_WINDOW;
