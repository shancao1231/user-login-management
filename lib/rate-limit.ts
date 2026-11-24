import "server-only";

import { consumeRedisRateLimit } from "@/lib/rate-limit-redis";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function consumeMemoryRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (existing.count >= limit) {
    return false;
  }

  existing.count += 1;
  return true;
}

/** 返回 true 表示允许；false 表示应拒绝（429）。配置 REDIS_URL 时走 Redis，否则进程内内存。 */
export async function consumeRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean> {
  if (process.env.REDIS_URL) {
    const redisResult = await consumeRedisRateLimit(key, limit, windowMs);
    if (redisResult !== null) {
      return redisResult;
    }
  }
  return consumeMemoryRateLimit(key, limit, windowMs);
}

export function rateLimitKey(parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join(":");
}
