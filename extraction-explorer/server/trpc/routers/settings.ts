import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getSettings, updateSettings } from "@/lib/extract/webhooks";
import { publicProcedure, router } from "@/server/trpc/trpc";

const updateInput = z.object({
  webhookUrl: z.string().url().nullable(),
});

export const settingsRouter = router({
  get: publicProcedure.query(async () => {
    try {
      const data = await getSettings();
      return { success: true as const, data };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("[settings:get]", error);
      throw new TRPCError({
        cause: error,
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not load settings",
      });
    }
  }),

  update: publicProcedure.input(updateInput).mutation(async ({ input }) => {
    try {
      const data = await updateSettings(input.webhookUrl);
      return { success: true as const, data, message: "Saved settings" };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("[settings:update]", error);
      throw new TRPCError({
        cause: error,
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not save settings",
      });
    }
  }),
});
