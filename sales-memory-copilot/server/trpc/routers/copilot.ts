import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { captureRequestSchema, prepareRequestSchema } from "@/lib/api/schemas";
import { runCaptureNotes, runPrepareMeeting } from "@/lib/server/copilot";
import { publicProcedure, router } from "@/server/trpc/trpc";

const captureInput = captureRequestSchema.and(
  z.object({
    baseId: z.string().min(1),
  }),
);

const prepareInput = prepareRequestSchema.and(
  z.object({
    baseId: z.string().min(1),
  }),
);

function mapCopilotError(error: unknown, prefix: string): TRPCError {
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

export const copilotRouter = router({
  capture: publicProcedure.input(captureInput).mutation(async ({ input }) => {
    try {
      const { baseId, ...body } = input;
      const data = await runCaptureNotes(baseId, body);
      return {
        success: true as const,
        data,
        message: "Captured notes",
      };
    } catch (error) {
      throw mapCopilotError(error, "[copilot:capture]");
    }
  }),

  prepare: publicProcedure.input(prepareInput).mutation(async ({ input }) => {
    try {
      const { baseId, ...body } = input;
      const data = await runPrepareMeeting(baseId, body);
      return {
        success: true as const,
        data,
        message: "Prepared brief",
      };
    } catch (error) {
      throw mapCopilotError(error, "[copilot:prepare]");
    }
  }),
});
