import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password", () => {
  it("哈希后可验证正确密码", async () => {
    const plain = "SecurePass_123!";
    const hash = await hashPassword(plain);
    expect(hash).not.toBe(plain);
    await expect(verifyPassword(plain, hash)).resolves.toBe(true);
  });

  it("错误密码验证失败", async () => {
    const hash = await hashPassword("CorrectOne_99");
    await expect(verifyPassword("WrongOne_99", hash)).resolves.toBe(false);
  });

  it("非法哈希返回 false", async () => {
    await expect(verifyPassword("x", "not-a-valid-hash")).resolves.toBe(false);
  });
});