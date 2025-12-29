import { router } from "../trpc";
import { transactionsRouter } from "./transactions";
import { goalsRouter } from "./goals";
import { categoriesRouter } from "./categories";
import { projectionsRouter } from "./projections";

export const appRouter = router({
  transactions: transactionsRouter,
  goals: goalsRouter,
  categories: categoriesRouter,
  projections: projectionsRouter,
});

export type AppRouter = typeof appRouter;