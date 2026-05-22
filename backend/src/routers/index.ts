import { router } from "../_core/trpc.js";
import { mangaRouter } from "./manga.js";
import { userRouter } from "./user.js";
import { adminRouter } from "./admin.js";

export const appRouter = router({
  manga: mangaRouter,
  user: userRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
