import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { memoryItemSchema } from "@/lib/api/schemas";
import { parseOwnerRepoFromInput } from "@/lib/github/parseRepoUrl";
import { ingestPrCommentsToMemories } from "@/lib/server/ingest-github-pr-comments";
import {
  deleteMemoryForBase,
  listMemoriesForBase,
} from "@/lib/server/memories";
import { seedSamplePrMemories } from "@/lib/server/seed-sample-pr-memories";
import { publicProcedure, router } from "@/server/trpc/trpc";

const listInput = z.object({
  baseId: z.string().trim().min(1),
});

const mutateBaseInput = z.object({
  baseId: z.string().trim().min(1),
});

const ingestInput = z.object({
  baseId: z.string().trim().min(1),
  repoUrl: z.string().trim().min(1, "Repository URL is required"),
});

export const memoryRouter = router({
  populateSamples: publicProcedure
    .input(mutateBaseInput)
    .mutation(async ({ input }) => {
      try {
        const data = await seedSamplePrMemories(input.baseId);
        return {
          success: true as const,
          data,
          message: `Added ${data.created} demo PR-style memories`,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[memory:populateSamples]", error);
        throw new TRPCError({
          cause: error,
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to populate sample memories",
        });
      }
    }),

  ingestFromPublicRepo: publicProcedure
    .input(ingestInput)
    .mutation(async ({ input }) => {
      if (!parseOwnerRepoFromInput(input.repoUrl)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            "Use a public GitHub URL with owner and repo, e.g. https://github.com/vercel/ai",
        });
      }
      try {
        const data = await ingestPrCommentsToMemories(
          input.baseId,
          input.repoUrl,
        );
        return {
          success: true as const,
          data,
          message:
            data.memoriesSynthesized === data.created
              ? `Synthesized and saved ${data.created} memories to this base (${data.rawCommentBlocks} raw review comments from ${data.prsConsidered} recent PRs).`
              : `Synthesized ${data.memoriesSynthesized} memories and saved ${data.created} to this base (${data.rawCommentBlocks} raw review comments from ${data.prsConsidered} recent PRs).`,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        const message =
          error instanceof Error
            ? error.message
            : "Failed to ingest from GitHub";
        console.error("[memory:ingestFromPublicRepo]", error);
        throw new TRPCError({
          cause: error,
          code: "BAD_REQUEST",
          message,
        });
      }
    }),

  list: publicProcedure.input(listInput).query(async ({ input }) => {
    try {
      const rows = await listMemoriesForBase(input.baseId);
      const data = z.array(memoryItemSchema).parse(rows);
      return {
        success: true as const,
        data,
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("[memory:list]", error);
      throw new TRPCError({
        cause: error,
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to list memories",
      });
    }
  }),

  delete: publicProcedure
    .input(
      z.object({
        baseId: z.string().trim().min(1),
        memoryId: z.string().trim().min(1),
      }),
    )
    .mutation(async ({ input }) => {
      try {
        await deleteMemoryForBase(input.baseId, input.memoryId);
        return {
          success: true as const,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[memory:delete]", error);
        throw new TRPCError({
          cause: error,
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete memory",
        });
      }
    }),
});
