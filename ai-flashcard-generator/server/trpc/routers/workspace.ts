import { TRPCError } from "@trpc/server";
import { createFlashcardWorkspace } from "@/lib/server/workspace";
import { publicProcedure, router } from "@/server/trpc/trpc";

export const workspaceRouter = router({
  create: publicProcedure.mutation(async () => {
    try {
      const data = await createFlashcardWorkspace();
      return {
        success: true as const,
        data,
        message: "Created workspace",
      };
    } catch (error) {
      if (error instanceof TRPCError) throw error;
      console.error("[workspace:create]", error);
      throw new TRPCError({
        cause: error,
        code: "INTERNAL_SERVER_ERROR",
        message: "Could not create workspace",
      });
    }
  }),
});
