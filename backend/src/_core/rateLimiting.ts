import { Redis } from "@upstash/redis";
import { RequestHandler } from "express";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL!,
  token: process.env.UPSTASH_REDIS_TOKEN!,
});

interface RateLimitOptions {
  key: string;
  maxRequests: number;
  windowSeconds: number;
}

export async function checkRateLimit(opts: RateLimitOptions): Promise<{ allowed: boolean; remaining: number }> {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - opts.windowSeconds;
  const redisKey = `rl:${opts.key}`;

  await redis.zremrangebyscore(redisKey, 0, windowStart);
  const count = await redis.zcard(redisKey);

  if (count >= opts.maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  await redis.zadd(redisKey, { score: now, member: `${now}-${Math.random()}` });
  await redis.expire(redisKey, opts.windowSeconds);

  return { allowed: true, remaining: opts.maxRequests - count - 1 };
}

export const apiRateLimitMiddleware: RequestHandler = async (req, res, next) => {
  const ip = req.ip ?? "unknown";
  const result = await checkRateLimit({ key: `api:${ip}`, maxRequests: 100, windowSeconds: 60 });

  if (!result.allowed) {
    res.status(429).json({ error: "Muitas requisições. Tente novamente em breve." });
    return;
  }

  res.setHeader("X-RateLimit-Remaining", result.remaining);
  next();
};
