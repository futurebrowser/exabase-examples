import type {
  ExtractChunk,
  ExtractJob,
  PresignedFile,
  PresignedImage,
} from "@exabase/sdk";

import {
  type ExtractChunkDto,
  type ExtractJobDto,
  extractChunkDtoSchema,
  extractJobDtoSchema,
} from "@/lib/api/schemas";

function ref(p: PresignedFile | PresignedImage | undefined | null) {
  if (!p) return null;
  return {
    url: p.url,
    mime: p.mime ?? null,
    size: "size" in p ? (p.size ?? null) : null,
    width: "width" in p ? (p.width ?? null) : null,
    height: "height" in p ? (p.height ?? null) : null,
  };
}

export function toExtractJobDto(job: ExtractJob): ExtractJobDto {
  const ex = job.extraction;
  const common = ex?.common ?? null;
  const document = ex?.document ?? null;
  const media = ex?.media ?? null;
  const web = ex?.web ?? null;

  return extractJobDtoSchema.parse({
    id: job.id,
    kind: String(job.kind),
    name: job.name,
    url: job.url,
    state: job.state,
    createdAt: job.createdAt.toISOString(),
    hasDownload: Boolean(job.links?.download),
    chunkCount: common?.chunkCount ?? 0,
    common: common
      ? {
          mimeType: common.mimeType,
          size: common.size,
          caption: common.caption ?? null,
          keywords: common.keywords ?? [],
          thumbnail: common.thumbnail ?? null,
          chunkCount: common.chunkCount ?? 0,
        }
      : null,
    document: document
      ? {
          pages: document.pages ?? null,
          author: document.author ?? null,
          title: document.title ?? null,
          subject: document.subject ?? null,
          pdfRender: ref(document.pdfRender),
        }
      : null,
    media: media
      ? {
          width: media.width ?? null,
          height: media.height ?? null,
          duration: media.duration ?? null,
          codec: media.codec ?? null,
          ocr: media.ocr ?? null,
          transcript: ref(media.transcript),
          screenshot: ref(media.screenshot),
        }
      : null,
    web: web
      ? {
          title: web.title ?? null,
          siteName: web.siteName ?? null,
          description: web.description ?? null,
          url: web.url ?? null,
          image: ref(web.image),
          favicon: ref(web.favicon),
          html: ref(web.html),
          reader: ref(web.reader),
        }
      : null,
  });
}

export function toChunkDto(chunk: ExtractChunk): ExtractChunkDto {
  return extractChunkDtoSchema.parse({
    sequence: chunk.sequence,
    text: chunk.text,
    pageNumber: chunk.pageNumber ?? null,
    timeStart: chunk.timeStart ?? null,
    timeEnd: chunk.timeEnd ?? null,
  });
}
