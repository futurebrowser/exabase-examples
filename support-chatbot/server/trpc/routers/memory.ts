import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { memoryItemSchema } from "@/lib/api/schemas";
import {
  deleteMemoryForBase,
  listMemoriesForBase,
} from "@/lib/server/memories";
import { seedSamplePersonalMemories } from "@/lib/server/seed-sample-memories";
import { publicProcedure, router } from "@/server/trpc/trpc";

const listInput = z.object({
  baseId: z.string().trim().min(1),
});

const mutateBaseInput = z.object({
  baseId: z.string().trim().min(1),
});

export const memoryRouter = router({
  populateSamples: publicProcedure
    .input(mutateBaseInput)
    .mutation(async ({ input }) => {
      try {
        const data = await seedSamplePersonalMemories(input.baseId);
        return {
          success: true as const,
          data,
          message: `Added ${data.created} demo memories`,
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
