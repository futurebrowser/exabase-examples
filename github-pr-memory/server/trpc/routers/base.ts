import { TRPCError } from "@trpc/server";

import { createGithubPrMemoryBase } from "@/lib/server/base";
import { publicProcedure, router } from "@/server/trpc/trpc";

export const baseRouter = router({
  create: publicProcedure.mutation(async () => {
    try {
      const data = await createGithubPrMemoryBase();
      return {
        success: true as const,
        data,
        message: "Created base",
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("[base:create]", error);
      throw new TRPCError({
        cause: error,
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not create base",
      });
    }
  }),
});
