import { z } from "zod";
import { eq } from "drizzle-orm";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc.js";
import { users, cpfVerifications, userNotificationPreferences, auditLogs } from "../db/schema.js";
import { verifyCPF } from "../services/cpfVerification.js";
import { checkRateLimit } from "../_core/rateLimiting.js";
import { TRPCError } from "@trpc/server";

export const userRouter = router({
  me: protectedProcedure.query(({ ctx }) => ctx.dbUser),

  syncClerk: publicProcedure
    .input(z.object({
      clerkId: z.string(),
      name: z.string().nullable(),
      email: z.string().email().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.select().from(users).where(eq(users.clerkId, input.clerkId)).limit(1);

      if (existing[0]) {
        await ctx.db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.clerkId, input.clerkId));
        return existing[0];
      }

      const inserted = await ctx.db.insert(users).values({
        clerkId: input.clerkId,
        name: input.name,
        email: input.email,
      }).returning({ id: users.id });

      return { id: inserted[0].id, clerkId: input.clerkId };
    }),

  verifyCPF: protectedProcedure
    .input(z.object({ cpf: z.string().length(11), birthDate: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.dbUser!.id;

      const rateResult = await checkRateLimit({
        key: `cpf:${userId}`,
        maxRequests: 10,
        windowSeconds: 86400,
      });

      if (!rateResult.allowed) {
        throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Limite de verificações de CPF atingido." });
      }

      const result = await verifyCPF(input.cpf, input.birthDate);

      await ctx.db.insert(cpfVerifications).values({
        userId,
        cpfHash: result.cpfHash,
        status: result.status,
        apiResponse: result.rawResponse,
      }).onConflictDoUpdate({
        target: cpfVerifications.userId,
        set: { status: result.status, verifiedAt: new Date() },
      });

      await ctx.db.insert(auditLogs).values({
        userId,
        action: "CPF_VERIFICATION",
        details: { status: result.status },
      });

      return { success: true, status: result.status, message: result.message };
    }),

  updateNotificationPreferences: protectedProcedure
    .input(z.object({
      newChapterNotifications: z.boolean().optional(),
      newChapterFrequency: z.enum(["IMMEDIATE", "DAILY", "WEEKLY"]).optional(),
      securityAlerts: z.boolean().optional(),
      weeklyDigest: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .insert(userNotificationPreferences)
        .values({ userId: ctx.dbUser!.id, ...input })
        .onConflictDoUpdate({
          target: userNotificationPreferences.userId,
          set: input,
        });

      return { success: true };
    }),

  notificationPreferences: protectedProcedure.query(async ({ ctx }) => {
    const prefs = await ctx.db
      .select()
      .from(userNotificationPreferences)
      .where(eq(userNotificationPreferences.userId, ctx.dbUser!.id))
      .limit(1);

    return prefs[0] ?? null;
  }),
});
