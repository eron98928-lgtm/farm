import { RequestHandler } from "express";

interface RateLimitOptions {
  key: string;
  maxRequests: number;
  windowSeconds: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

// ─── Fallback em memória (quando Redis não está configurado) ──────────────────

const memoryStore = new Map<string, number[]>();

function checkMemoryRateLimit(opts: RateLimitOptions): RateLimitResult {
  const now = Date.now() / 1000;
  const windowStart = now - opts.windowSeconds;
  const existing = (memoryStore.get(opts.key) ?? []).filter(t => t > windowStart);

  if (existing.length >= opts.maxRequests) {
    memoryStore.set(opts.key, existing);
    return { allowed: false, remaining: 0 };
  }

  existing.push(now);
  memoryStore.set(opts.key, existing);

  // Limpeza periódica para evitar leak de memória
  if (memoryStore.size > 10_000) {
    for (const [k, times] of memoryStore) {
      if (times.every(t => t < windowStart)) memoryStore.delete(k);
    }
  }

  return { allowed: true, remaining: opts.maxRequests - existing.length };
}

// ─── Redis (quando UPSTASH_REDIS_URL está configurado) ───────────────────────

async function checkRedisRateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const { Redis } = await import("@upstash/redis");
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_URL!,
    token: process.env.UPSTASH_REDIS_TOKEN!,
  });

  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - opts.windowSeconds;
  const key = `rl:${opts.key}`;

  await redis.zremrangebyscore(key, 0, windowStart);
  const count = await redis.zcard(key);

  if (count >= opts.maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  await redis.zadd(key, { score: now, member: `${now}-${Math.random()}` });
  await redis.expire(key, opts.windowSeconds);

  return { allowed: true, remaining: opts.maxRequests - count - 1 };
}

// ─── Dispatcher: Redis se disponível, memória como fallback ──────────────────

export async function checkRateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  if (process.env.UPSTASH_REDIS_URL) {
    try {
      return await checkRedisRateLimit(opts);
    } catch {
      // Redis indisponível — fallback silencioso para memória
    }
  }
  return checkMemoryRateLimit(opts);
}

// ─── Políticas por rota ───────────────────────────────────────────────────────

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

// Limite mais restritivo para endpoints de autenticação/admin
export const authRateLimitMiddleware: RequestHandler = async (req, res, next) => {
  const ip = req.ip ?? "unknown";
  const result = await checkRateLimit({ key: `auth:${ip}`, maxRequests: 10, windowSeconds: 60 });

  if (!result.allowed) {
    res.status(429).json({ error: "Limite de tentativas excedido. Aguarde 1 minuto." });
    return;
  }

  next();
};
