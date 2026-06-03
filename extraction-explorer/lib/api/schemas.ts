import { z } from "zod";

export const extractStateSchema = z
  .enum(["pending", "processing", "completed", "failed", "cleaned"])
  .nullable();
export type ExtractState = z.infer<typeof extractStateSchema>;

/** A presigned attachment link (PresignedFile / PresignedImage). */
export const presignedRefSchema = z.object({
  url: z.string(),
  mime: z.string().nullable().optional(),
  size: z.number().nullable().optional(),
  width: z.number().nullable().optional(),
  height: z.number().nullable().optional(),
});
export type PresignedRef = z.infer<typeof presignedRefSchema>;

export const extractCommonSchema = z.object({
  mimeType: z.string().nullable(),
  size: z.number().nullable(),
  caption: z.string().nullable(),
  keywords: z.array(z.string()),
  thumbnail: z.string().nullable(),
  chunkCount: z.number(),
});

export const extractDocumentSchema = z.object({
  pages: z.number().nullable(),
  author: z.string().nullable(),
  title: z.string().nullable(),
  subject: z.string().nullable(),
  pdfRender: presignedRefSchema.nullable(),
});

export const extractMediaSchema = z.object({
  width: z.number().nullable(),
  height: z.number().nullable(),
  duration: z.number().nullable(),
  codec: z.string().nullable(),
  ocr: z.string().nullable(),
  transcript: presignedRefSchema.nullable(),
  screenshot: presignedRefSchema.nullable(),
});

export const extractWebSchema = z.object({
  title: z.string().nullable(),
  siteName: z.string().nullable(),
  description: z.string().nullable(),
  url: z.string().nullable(),
  image: presignedRefSchema.nullable(),
  favicon: presignedRefSchema.nullable(),
  html: presignedRefSchema.nullable(),
  reader: presignedRefSchema.nullable(),
});

export const extractJobDtoSchema = z.object({
  id: z.string(),
  kind: z.string(),
  name: z.string().nullable(),
  url: z.string().nullable(),
  state: extractStateSchema,
  createdAt: z.string(),
  hasDownload: z.boolean(),
  chunkCount: z.number(),
  common: extractCommonSchema.nullable(),
  document: extractDocumentSchema.nullable(),
  media: extractMediaSchema.nullable(),
  web: extractWebSchema.nullable(),
});
export type ExtractJobDto = z.infer<typeof extractJobDtoSchema>;

export const extractJobListSchema = z.object({
  items: z.array(extractJobDtoSchema),
  nextCursor: z.string().nullable(),
});
export type ExtractJobList = z.infer<typeof extractJobListSchema>;

export const extractChunkDtoSchema = z.object({
  sequence: z.number(),
  text: z.string(),
  pageNumber: z.number().nullable(),
  timeStart: z.number().nullable(),
  timeEnd: z.number().nullable(),
});
export type ExtractChunkDto = z.infer<typeof extractChunkDtoSchema>;

export const extractChunksDtoSchema = z.object({
  items: z.array(extractChunkDtoSchema),
});
export type ExtractChunksDto = z.infer<typeof extractChunksDtoSchema>;

export const extractSettingsDtoSchema = z.object({
  webhookUrl: z.string().nullable(),
});
export type ExtractSettingsDto = z.infer<typeof extractSettingsDtoSchema>;

export const webhookLogStatusSchema = z.enum([
  "pending",
  "success",
  "retrying",
  "failed",
]);
export type WebhookLogStatusDto = z.infer<typeof webhookLogStatusSchema>;

export const webhookLogSummaryDtoSchema = z.object({
  id: z.string(),
  traceId: z.string(),
  attemptNumber: z.number(),
  status: webhookLogStatusSchema,
  statusCode: z.number().nullable(),
  errorMessage: z.string().nullable(),
  firedAt: z.string().nullable(),
  createdAt: z.string(),
});
export type WebhookLogSummaryDto = z.infer<typeof webhookLogSummaryDtoSchema>;

export const webhookLogsDtoSchema = z.object({
  items: z.array(webhookLogSummaryDtoSchema),
});
export type WebhookLogsDto = z.infer<typeof webhookLogsDtoSchema>;

export const webhookLogDetailDtoSchema = webhookLogSummaryDtoSchema.extend({
  requestPayloadJson: z.string().nullable(),
  responseBody: z.string().nullable(),
});
export type WebhookLogDetailDto = z.infer<typeof webhookLogDetailDtoSchema>;

/** Client → server upload result (from the upload route handler). */
export const uploadResponseSchema = extractJobDtoSchema;
export type UploadResponse = z.infer<typeof uploadResponseSchema>;
