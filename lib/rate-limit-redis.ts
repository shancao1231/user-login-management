import "server-only";

import { createClient, type RedisClientType } from "redis";

let client: RedisClientType | null = null;
let connectPromise: Promise<RedisClientType | null> | null = null;

async function getClient(): Promise<RedisClientType | null> {
  const url = process.env.REDIS_URL;
  if (!url) {
    return null;
  }
  if (client?.isOpen) {
    return client;
  }
  if (!connectPromise) {
    connectPromise = (async () => {
      try {
        const c = createClient({ url });
        c.on("error", () => {
          /* 连接抖动时回退内存限流 */
        });
        await c.connect();
        client = c as RedisClientType;
        return client;
      } catch {
        return null;
      }
    })();
  }
  return connectPromise;
}

/**
 * 固定窗口限流。返回 null 表示 Redis 不可用，调用方应回退内存实现。
 */
export async function consumeRedisRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<boolean | null> {
  const redis = await getClient();
  if (!redis) {
    return null;
  }

  const redisKey = `rl:${key}`;
  try {
    const count = await redis.incr(redisKey);
    if (count === 1) {
      await redis.pExpire(redisKey, windowMs);
    }
    return count <= limit;
  } catch {
    return null;
  }
}
