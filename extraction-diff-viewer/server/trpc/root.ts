import { extractRouter } from "@/server/trpc/routers/extract";
import { router } from "@/server/trpc/trpc";

export const appRouter = router({
  extract: extractRouter,
});

export type AppRouter = typeof appRouter;
