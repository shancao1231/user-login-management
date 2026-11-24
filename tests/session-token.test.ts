import { describe, expect, it } from "vitest";
import { generateSessionToken, hashSessionToken } from "@/lib/auth/session-token";

describe("session-token", () => {
  it("generateSessionToken 长度与字符集合理", () => {
    const t1 = generateSessionToken();
    const t2 = generateSessionToken();
    expect(t1.length).toBeGreaterThan(20);
    expect(t1).not.toBe(t2);
    expect(t1).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("hashSessionToken 确定且区分不同 token", () => {
    const a = "token-a";
    const b = "token-b";
    expect(hashSessionToken(a)).toBe(hashSessionToken(a));
    expect(hashSessionToken(a)).not.toBe(hashSessionToken(b));
    expect(hashSessionToken(a)).toHaveLength(64);
  });
});
