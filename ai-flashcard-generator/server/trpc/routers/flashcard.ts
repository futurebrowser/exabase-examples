import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { listWorkspaceDocuments } from "@/lib/server/documents";
import {
  deleteAllFlashcardsForBase,
  listFlashcardsForBase,
} from "@/lib/server/flashcards";
import { runGenerateFlashcards } from "@/lib/server/generate-flashcards";
import { publicProcedure, router } from "@/server/trpc/trpc";

const baseIdInput = z.object({
  baseId: z.string().min(1),
});

const generateInput = z.object({
  baseId: z.string().min(1),
  topic: z.string(),
  count: z.number().int().min(1).max(20),
});

function mapFlashcardError(error: unknown, prefix: string): TRPCError {
  if (error instanceof TRPCError) return error;
  if (error instanceof Error) {
    const msg = error.message;
    if (msg === "OPENAI_API_KEY is not configured") {
      return new TRPCError({
        cause: error,
        code: "SERVICE_UNAVAILABLE",
        message: msg,
      });
    }
    return new TRPCError({
      cause: error,
      code: "BAD_REQUEST",
      message: msg,
    });
  }
  console.error(prefix, error);
  return new TRPCError({
    cause: error,
    code: "INTERNAL_SERVER_ERROR",
    message: "Request failed",
  });
}

export const flashcardRouter = router({
  deleteAll: publicProcedure.input(baseIdInput).mutation(async ({ input }) => {
    try {
      const data = await deleteAllFlashcardsForBase(input.baseId);
      return {
        success: true as const,
        data,
        message: "Deleted flashcards",
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("[flashcard:deleteAll]", error);
      throw new TRPCError({
        cause: error,
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not delete flashcards",
      });
    }
  }),

  documents: publicProcedure.input(baseIdInput).query(async ({ input }) => {
    try {
      const data = await listWorkspaceDocuments(input.baseId);
      return { success: true as const, data };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("[flashcard:documents]", error);
      throw new TRPCError({
        cause: error,
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not load documents",
      });
    }
  }),

  flashcards: publicProcedure.input(baseIdInput).query(async ({ input }) => {
    try {
      const data = await listFlashcardsForBase(input.baseId);
      return { success: true as const, data };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("[flashcard:flashcards]", error);
      throw new TRPCError({
        cause: error,
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not load flashcards",
      });
    }
  }),

  generate: publicProcedure.input(generateInput).mutation(async ({ input }) => {
    try {
      const data = await runGenerateFlashcards(
        input.baseId,
        input.topic,
        input.count,
      );
      return {
        success: true as const,
        data,
        message: "Generated flashcards",
      };
    } catch (error) {
      throw mapFlashcardError(error, "[flashcard:generate]");
    }
  }),
});
