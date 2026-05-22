import { z } from "zod";
import { eq, desc, like, and } from "drizzle-orm";
import { router, publicProcedure, protectedProcedure } from "../_core/trpc.js";
import { mangas, chapters, userHistory, userFavorites } from "../db/schema.js";

export const mangaRouter = router({
  list: publicProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().max(50).default(20),
      genre: z.string().optional(),
      search: z.string().optional(),
      status: z.enum(["ongoing", "completed", "hiatus"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.limit;
      const conditions = [];

      if (input.status) conditions.push(eq(mangas.status, input.status));
      if (input.search) conditions.push(like(mangas.title, `%${input.search}%`));

      const results = await ctx.db
        .select()
        .from(mangas)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(mangas.views))
        .limit(input.limit)
        .offset(offset);

      return results;
    }),

  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(mangas)
        .where(eq(mangas.slug, input.slug))
        .limit(1);

      if (!result[0]) return null;

      const mangaChapters = await ctx.db
        .select()
        .from(chapters)
        .where(eq(chapters.mangaId, result[0].id))
        .orderBy(desc(chapters.chapterNumber));

      return { ...result[0], chapters: mangaChapters };
    }),

  chapter: publicProcedure
    .input(z.object({ mangaId: z.number(), chapterNumber: z.string() }))
    .query(async ({ ctx, input }) => {
      const result = await ctx.db
        .select()
        .from(chapters)
        .where(and(eq(chapters.mangaId, input.mangaId), eq(chapters.chapterNumber, input.chapterNumber)))
        .limit(1);

      return result[0] ?? null;
    }),

  markRead: protectedProcedure
    .input(z.object({ mangaId: z.number(), chapterId: z.number(), lastReadPage: z.number().default(0) }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(userHistory)
        .values({ userId: ctx.dbUser!.id, mangaId: input.mangaId, chapterId: input.chapterId, lastReadPage: input.lastReadPage });

      return { success: true };
    }),

  toggleFavorite: protectedProcedure
    .input(z.object({ mangaId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db
        .select()
        .from(userFavorites)
        .where(and(eq(userFavorites.userId, ctx.dbUser!.id), eq(userFavorites.mangaId, input.mangaId)))
        .limit(1);

      if (existing[0]) {
        await ctx.db.delete(userFavorites).where(eq(userFavorites.id, existing[0].id));
        return { favorited: false };
      }

      await ctx.db.insert(userFavorites).values({ userId: ctx.dbUser!.id, mangaId: input.mangaId });
      return { favorited: true };
    }),
});
