import { flashcardRouter } from "@/server/trpc/routers/flashcard";
import { workspaceRouter } from "@/server/trpc/routers/workspace";
import { router } from "@/server/trpc/trpc";

export const appRouter = router({
  flashcard: flashcardRouter,
  workspace: workspaceRouter,
});

export type AppRouter = typeof appRouter;
