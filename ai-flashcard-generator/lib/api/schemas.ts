import { z } from "zod";

export const processingStateSchema = z
  .enum(["pending", "processing", "completed", "failed"])
  .nullable();

export const documentRowSchema = z.object({
  id: z.string(),
  kind: z.string(),
  mimeType: z.string().nullable(),
  name: z.string().nullable(),
  caption: z.string().nullable(),
  stateProcessing: processingStateSchema,
});

export const documentsResponseSchema = z.object({
  documents: z.array(documentRowSchema),
});

export type DocumentRow = z.infer<typeof documentRowSchema>;
export type DocumentsResponse = z.infer<typeof documentsResponseSchema>;

export const flashcardRowSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  text: z.string(),
});

export const flashcardsResponseSchema = z.object({
  flashcards: z.array(flashcardRowSchema),
});

export type FlashcardRow = z.infer<typeof flashcardRowSchema>;
export type FlashcardsResponse = z.infer<typeof flashcardsResponseSchema>;

export const uploadResponseSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  stateProcessing: processingStateSchema,
});

export type UploadResponse = z.infer<typeof uploadResponseSchema>;

export const generateFlashcardsResponseSchema = z.object({
  created: z.number(),
  thinContext: z.boolean(),
});

export type GenerateFlashcardsResponse = z.infer<
  typeof generateFlashcardsResponseSchema
>;

export const deleteAllFlashcardsResponseSchema = z.object({
  deleted: z.number(),
});

export type DeleteAllFlashcardsResponse = z.infer<
  typeof deleteAllFlashcardsResponseSchema
>;

export const createBaseResponseSchema = z.object({
  baseId: z.string(),
});

export type CreateBaseResponse = z.infer<typeof createBaseResponseSchema>;
