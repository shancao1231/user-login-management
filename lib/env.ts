import "server-only";

import { z } from "zod";

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, { error: "缺少 DATABASE_URL" }),
  SESSION_SECRET: z.string().min(32, { error: "SESSION_SECRET 至少 32 字符" }),
  APP_URL: z.url().optional(),
  SESSION_COOKIE_NAME: z.string().min(1).optional(),
  SESSION_MAX_AGE_SECONDS: z.coerce.number().int().positive().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | undefined;

/** 解析并缓存进程环境变量（仅在服务端调用） */
export function getServerEnv(): ServerEnv {
  if (cached) {
    return cached;
  }
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const message = result.error.issues.map((i) => i.message).join("; ");
    throw new Error(`环境变量无效: ${message}`);
  }
  cached = result.data;
  return cached;
}
