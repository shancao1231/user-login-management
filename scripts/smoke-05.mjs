/**
 * 步骤 0.5 验收：Zod 校验 + argon2 哈希（在 Node 中运行，非 Next 路由）
 */
import argon2 from "argon2";
import { z } from "zod";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .pipe(z.email())
    .transform((v) => v.toLowerCase()),
  password: z.string().min(8),
});

const parsed = loginSchema.safeParse({
  email: "  Demo@Example.COM ",
  password: "secret-pass",
});

if (!parsed.success) {
  console.error("Zod 校验失败", parsed.error.flatten());
  process.exit(1);
}

const hash = await argon2.hash(parsed.data.password, { type: argon2.argon2id });
const ok = await argon2.verify(hash, parsed.data.password);
const bad = await argon2.verify(hash, "wrong-password");

if (!ok || bad) {
  console.error("argon2 验收失败");
  process.exit(1);
}

console.log("smoke:05 OK", {
  email: parsed.data.email,
  passwordHashPrefix: hash.slice(0, 20) + "...",
});
