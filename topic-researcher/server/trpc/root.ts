import { workersRouter } from "./routers/workers";
import { router } from "./trpc";

export const appRouter = router({
  workers: workersRouter,
});

export type AppRouter = typeof appRouter;
