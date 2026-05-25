import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { router, adminProcedure } from "../_core/trpc.js";
import { mangas, chapters, users, securityEvents, userRiskScores, emailLogs, adminActions, auditLogs } from "../db/schema.js";
import { validateSupabaseStorageUrl } from "../_core/imageMetadataCleaner.js";

export const adminRouter = router({
  getMangaList: adminProcedure
    .input(z.object({ page: z.number().default(1), limit: z.number().max(100).default(20) }))
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.limit;
      return ctx.db.select().from(mangas).orderBy(desc(mangas.createdAt)).limit(input.limit).offset(offset);
    }),

  createManga: adminProcedure
    .input(z.object({
      title: z.string().min(1).max(500),
      slug: z.string().min(1).max(500),
      description: z.string().optional(),
      coverImage: z.string().url().optional(),
      status: z.enum(["ongoing", "completed", "hiatus"]).default("ongoing"),
      rating: z.enum(["L", "L10", "L12", "L14", "L16", "L18"]).default("L12"),
      genres: z.array(z.string()).optional(),
      author: z.string().optional(),
      artist: z.string().optional(),
      isPremium: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await ctx.db.insert(mangas).values(input).returning({ id: mangas.id });
      const mangaId = result[0].id;

      await ctx.db.insert(adminActions).values({
        adminId: ctx.dbUser!.id,
        actionType: "CREATE_MANGA",
        targetId: mangaId,
        details: { title: input.title },
      });

      return { id: mangaId };
    }),

  updateManga: adminProcedure
    .input(z.object({
      mangaId: z.number(),
      data: z.object({
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["ongoing", "completed", "hiatus"]).optional(),
        isPremium: z.boolean().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.update(mangas).set(input.data).where(eq(mangas.id, input.mangaId));

      await ctx.db.insert(adminActions).values({
        adminId: ctx.dbUser!.id,
        actionType: "UPDATE_MANGA",
        targetId: input.mangaId,
        details: input.data,
      });

      return { success: true };
    }),

  deleteManga: adminProcedure
    .input(z.object({ mangaId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.delete(mangas).where(eq(mangas.id, input.mangaId));

      await ctx.db.insert(adminActions).values({
        adminId: ctx.dbUser!.id,
        actionType: "DELETE_MANGA",
        targetId: input.mangaId,
        details: {},
      });

      return { success: true };
    }),

  uploadChapter: adminProcedure
    .input(z.object({
      mangaId: z.number(),
      chapterNumber: z.string(),
      title: z.string().optional(),
      pages: z.array(z.string().url()),
      isPremium: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const invalidUrls = input.pages.filter(url => !validateSupabaseStorageUrl(url));
      if (invalidUrls.length > 0) {
        throw new Error(`URLs inválidas — apenas Supabase Storage aceito: ${invalidUrls.join(", ")}`);
      }

      const result = await ctx.db.insert(chapters).values({
        mangaId: input.mangaId,
        chapterNumber: input.chapterNumber,
        title: input.title,
        pages: input.pages,
        isPremium: input.isPremium,
      }).returning({ id: chapters.id });

      return { id: result[0].id };
    }),

  getUserList: adminProcedure
    .input(z.object({ page: z.number().default(1), limit: z.number().max(100).default(20) }))
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.limit;
      return ctx.db.select().from(users).orderBy(desc(users.createdAt)).limit(input.limit).offset(offset);
    }),

  blockUser: adminProcedure
    .input(z.object({
      userId: z.number(),
      reason: z.string(),
      durationHours: z.number().default(24),
    }))
    .mutation(async ({ ctx, input }) => {
      const blockedUntil = new Date(Date.now() + input.durationHours * 3600 * 1000);

      await ctx.db
        .insert(userRiskScores)
        .values({ userId: input.userId, riskScore: 100, blockedUntil, reason: input.reason })
        .onConflictDoUpdate({
          target: userRiskScores.userId,
          set: { blockedUntil, reason: input.reason, riskScore: 100 },
        });

      await ctx.db.insert(adminActions).values({
        adminId: ctx.dbUser!.id,
        actionType: "BLOCK_USER",
        targetId: input.userId,
        details: { reason: input.reason, durationHours: input.durationHours },
      });

      return { success: true };
    }),

  getSecurityEvents: adminProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().max(100).default(50),
      eventType: z.enum(["RATE_LIMIT", "SUSPICIOUS_LOGIN", "SUSPICIOUS_SIGNUP", "BOT_DETECTED", "SCRAPING", "BRUTE_FORCE"]).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.limit;
      const conditions = input.eventType ? [eq(securityEvents.eventType, input.eventType)] : [];

      return ctx.db
        .select()
        .from(securityEvents)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(securityEvents.createdAt))
        .limit(input.limit)
        .offset(offset);
    }),

  getEmailLogs: adminProcedure
    .input(z.object({ page: z.number().default(1), limit: z.number().max(100).default(50) }))
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.limit;
      return ctx.db.select().from(emailLogs).orderBy(desc(emailLogs.sentAt)).limit(input.limit).offset(offset);
    }),

  getAuditLogs: adminProcedure
    .input(z.object({ page: z.number().default(1), limit: z.number().max(100).default(50) }))
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.limit;
      return ctx.db.select().from(auditLogs).orderBy(desc(auditLogs.createdAt)).limit(input.limit).offset(offset);
    }),
});
