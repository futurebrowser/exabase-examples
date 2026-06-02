import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createFromUrl } from "@/lib/extract/create-url";
import { getAllChunkText, getJob } from "@/lib/extract/service";
import { publicProcedure, router } from "@/server/trpc/trpc";

const jobInput = z.object({ jobId: z.string().min(1) });
const createInput = z.object({
  url: z.string().url(),
  name: z.string().min(1).max(255).optional(),
});

function fail(error: unknown, tag: string, message: string): TRPCError {
  if (error instanceof TRPCError) return error;
  console.error(tag, error);
  return new TRPCError({
    cause: error,
    code: "INTERNAL_SERVER_ERROR",
    message,
  });
}

export const extractRouter = router({
  create: publicProcedure.input(createInput).mutation(async ({ input }) => {
    try {
      const data = await createFromUrl(input.url, input.name);
      return { success: true as const, data };
    } catch (error) {
      throw fail(error, "[extract:create]", "Could not create extraction");
    }
  }),

  get: publicProcedure.input(jobInput).query(async ({ input }) => {
    try {
      const data = await getJob(input.jobId);
      return { success: true as const, data };
    } catch (error) {
      throw fail(error, "[extract:get]", "Could not load job");
    }
  }),

  allChunks: publicProcedure.input(jobInput).query(async ({ input }) => {
    try {
      const text = await getAllChunkText(input.jobId);
      return { success: true as const, data: { text } };
    } catch (error) {
      throw fail(error, "[extract:allChunks]", "Could not load all chunks");
    }
  }),
});
