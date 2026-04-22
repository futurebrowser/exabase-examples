import { baseRouter } from "@/server/trpc/routers/base";
import { copilotRouter } from "@/server/trpc/routers/copilot";
import { router } from "@/server/trpc/trpc";

export const appRouter = router({
  copilot: copilotRouter,
  base: baseRouter,
});

export type AppRouter = typeof appRouter;
