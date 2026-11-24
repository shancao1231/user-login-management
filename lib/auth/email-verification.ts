import "server-only";

import { prisma } from "@/lib/db";
import { generateSessionToken, hashSessionToken } from "@/lib/auth/session-token";

const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;

export async function createEmailVerificationToken(
  userId: string,
): Promise<{ token: string; expiresAt: Date }> {
  await prisma.emailVerificationToken.deleteMany({
    where: { userId, usedAt: null },
  });

  const token = generateSessionToken();
  const tokenHash = hashSessionToken(token);
  const expiresAt = new Date(Date.now() + VERIFY_TTL_MS);

  await prisma.emailVerificationToken.create({
    data: { userId, tokenHash, expiresAt },
  });

  return { token, expiresAt };
}

export async function consumeEmailVerificationToken(
  rawToken: string,
): Promise<{ userId: string } | null> {
  const tokenHash = hashSessionToken(rawToken);
  const row = await prisma.emailVerificationToken.findUnique({
    where: { tokenHash },
  });

  if (!row || row.usedAt || row.expiresAt <= new Date()) {
    return null;
  }

  await prisma.$transaction([
    prisma.emailVerificationToken.update({
      where: { id: row.id },
      data: { usedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: row.userId },
      data: { emailVerifiedAt: new Date() },
    }),
  ]);

  return { userId: row.userId };
}
