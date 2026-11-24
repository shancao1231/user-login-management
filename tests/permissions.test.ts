import { describe, expect, it } from "vitest";
import { hasAnyPermission, hasPermission } from "@/lib/auth/permissions";

describe("permissions (pure)", () => {
  const perms = ["user:read", "audit:read"];

  it("hasPermission", () => {
    expect(hasPermission(perms, "user:read")).toBe(true);
    expect(hasPermission(perms, "user:write")).toBe(false);
  });

  it("hasAnyPermission", () => {
    expect(hasAnyPermission(perms, ["user:write", "audit:read"])).toBe(true);
    expect(hasAnyPermission(perms, ["role:manage"])).toBe(false);
  });
});