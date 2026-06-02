import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createFromUrl } from "@/lib/extract/create-url";
import {
  getChunks,
  getJob,
  listJobs,
  reprocessJob,
} from "@/lib/extract/service";
import {
  getWebhookLog,
  listWebhookLogs,
  triggerWebhook,
} from "@/lib/extract/webhooks";
import { publicProcedure, router } from "@/server/trpc/trpc";

const jobInput = z.object({ jobId: z.string().min(1) });
const listInput = z.object({ cursor: z.string().optional() });
const chunksInput = jobInput.extend({ start: z.number().int().min(1) });
const webhookLogInput = jobInput.extend({ logId: z.string().min(1) });
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

  list: publicProcedure.input(listInput).query(async ({ input }) => {
    try {
      const data = await listJobs(input.cursor);
      return { success: true as const, data };
    } catch (error) {
      throw fail(error, "[extract:list]", "Could not list jobs");
    }
  }),

  chunks: publicProcedure.input(chunksInput).query(async ({ input }) => {
    try {
      const data = await getChunks(input.jobId, input.start);
      return { success: true as const, data };
    } catch (error) {
      throw fail(error, "[extract:chunks]", "Could not load chunks");
    }
  }),

  reprocess: publicProcedure.input(jobInput).mutation(async ({ input }) => {
    try {
      await reprocessJob(input.jobId);
      return { success: true as const, message: "Reprocessing triggered" };
    } catch (error) {
      throw fail(error, "[extract:reprocess]", "Could not reprocess job");
    }
  }),

  webhookLogs: publicProcedure.input(jobInput).query(async ({ input }) => {
    try {
      const data = await listWebhookLogs(input.jobId);
      return { success: true as const, data };
    } catch (error) {
      throw fail(error, "[extract:webhookLogs]", "Could not load webhook logs");
    }
  }),

  webhookLog: publicProcedure
    .input(webhookLogInput)
    .query(async ({ input }) => {
      try {
        const data = await getWebhookLog(input.jobId, input.logId);
        return { success: true as const, data };
      } catch (error) {
        throw fail(error, "[extract:webhookLog]", "Could not load webhook log");
      }
    }),

  triggerWebhook: publicProcedure
    .input(jobInput)
    .mutation(async ({ input }) => {
      try {
        const data = await triggerWebhook(input.jobId);
        return { success: true as const, data, message: "Webhook triggered" };
      } catch (error) {
        throw fail(
          error,
          "[extract:triggerWebhook]",
          "Could not trigger webhook",
        );
      }
    }),
});
