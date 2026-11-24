import { describe, expect, it } from "vitest";
import { consumeRateLimit, rateLimitKey } from "@/lib/rate-limit";

describe("rate-limit", () => {
  it("rateLimitKey 拼接", () => {
    expect(rateLimitKey(["login", "1.2.3.4", "a@b.com"])).toBe(
      "login:1.2.3.4:a@b.com",
    );
    expect(rateLimitKey(["x", undefined, "y"])).toBe("x:y");
  });

  it("窗口内超过上限后拒绝", async () => {
    const key = `vitest-${Date.now()}-${Math.random()}`;
    const windowMs = 60_000;
    expect(await consumeRateLimit(key, 2, windowMs)).toBe(true);
    expect(await consumeRateLimit(key, 2, windowMs)).toBe(true);
    expect(await consumeRateLimit(key, 2, windowMs)).toBe(false);
  });
});