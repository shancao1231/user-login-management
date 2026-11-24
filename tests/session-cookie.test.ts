import { afterEach, describe, expect, it, vi } from "vitest";
import { buildSessionCookieOptions } from "@/lib/auth/session";

describe("session cookie", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("开发环境 Cookie 非 Secure", () => {
    vi.stubEnv("NODE_ENV", "development");
    const opts = buildSessionCookieOptions("tok");
    expect(opts.httpOnly).toBe(true);
    expect(opts.sameSite).toBe("lax");
    expect(opts.secure).toBe(false);
    expect(opts.value).toBe("tok");
  });

  it("生产环境 Cookie Secure", () => {
    vi.stubEnv("NODE_ENV", "production");
    const opts = buildSessionCookieOptions("tok");
    expect(opts.secure).toBe(true);
  });
});