import "server-only";

import argon2 from "argon2";

/** argon2 含原生模块，仅在 Node.js 路由 / Server Actions 中使用，勿用于 Edge。 */
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

export async function hashPassword(plain: string): Promise<string> {
  return (await argon2.hash(plain, ARGON2_OPTIONS)) as string;
}

export async function verifyPassword(
  plain: string,
  passwordHash: string,
): Promise<boolean> {
  try {
    return await argon2.verify(passwordHash, plain);
  } catch {
    return false;
  }
}
