import { extractRouter } from "@/server/trpc/routers/extract";
import { settingsRouter } from "@/server/trpc/routers/settings";
import { router } from "@/server/trpc/trpc";

export const appRouter = router({
  extract: extractRouter,
  settings: settingsRouter,
});

export type AppRouter = typeof appRouter;
