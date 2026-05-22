import { initTRPC, TRPCError } from "@trpc/server";
import { createClerkClient, verifyToken } from "@clerk/backend";
import { Request, Response } from "express";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import { eq } from "drizzle-orm";

const clerkClient = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
void clerkClient;

export async function createContext({ req, res }: { req: Request; res: Response }) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace("Bearer ", "");

  let clerkUser = null;
  let dbUser = null;

  if (token && process.env.CLERK_SECRET_KEY) {
    try {
      const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY });
      clerkUser = payload;
      const found = await db.select().from(users).where(eq(users.clerkId, payload.sub)).limit(1);
      dbUser = found[0] ?? null;
    } catch {
      // token inválido — continua sem autenticação
    }
  }

  return { req, res, clerkUser, dbUser, db };
}

export type Context = Awaited<ReturnType<typeof createContext>>;

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.clerkUser || !ctx.dbUser) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, clerkUser: ctx.clerkUser, dbUser: ctx.dbUser } });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.dbUser!.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});
