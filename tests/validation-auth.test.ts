import { describe, expect, it } from "vitest";
import {
  emailField,
  loginBodySchema,
  passwordField,
  registerBodySchema,
} from "@/lib/validation/auth";

describe("validation/auth", () => {
  it("email 去空格并小写", () => {
    expect(emailField.parse("  Admin@Example.COM  ")).toBe("admin@example.com");
  });

  it("password 最少 8 位", () => {
    expect(() => passwordField.parse("short")).toThrow();
    expect(passwordField.parse("long-enough")).toBe("long-enough");
  });

  it("registerBodySchema", () => {
    const data = registerBodySchema.parse({
      email: " u@ex.com ",
      password: "12345678",
      name: "  Hi ",
    });
    expect(data.email).toBe("u@ex.com");
    expect(data.name).toBe("Hi");
  });

  it("loginBodySchema 需要密码非空", () => {
    expect(() =>
      loginBodySchema.parse({ email: "a@b.com", password: "" }),
    ).toThrow();
  });
});