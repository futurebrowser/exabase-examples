import { router } from "@/server/trpc/trpc";
import { baseRouter } from "./routers/base";
import { memoryRouter } from "./routers/memory";

export const appRouter = router({
  base: baseRouter,
  memory: memoryRouter,
});

export type AppRouter = typeof appRouter;
