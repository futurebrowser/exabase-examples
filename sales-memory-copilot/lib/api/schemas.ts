import { z } from "zod";

export const memoryItemSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  content: z.string(),
  createdAt: z.string().nullable(),
});

export const prepareRequestSchema = z.object({
  clientName: z.string().trim().min(1).max(120),
  ask: z.string().trim().max(1000).optional(),
  limit: z.number().int().min(3).max(20).default(8),
});

export const prepareResponseSchema = z.object({
  brief: z.string(),
  memoriesUsed: z.array(memoryItemSchema),
});

export const captureRequestSchema = z.object({
  clientName: z.string().trim().min(1).max(120),
  notes: z.string().trim().min(1).max(12000),
});

export const captureCreatedMemorySchema = z.object({
  memoryId: z.string(),
  memoryTitle: z.string(),
  memoryContent: z.string(),
});

export const captureResponseSchema = z.object({
  created: z.array(captureCreatedMemorySchema),
  totalCreated: z.number().int().min(0),
});

export const createBaseResponseSchema = z.object({
  baseId: z.string(),
});
