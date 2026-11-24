import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "ChangeMe_Admin123!";

test.describe("登录与管理后台", () => {
  test("超级管理员可登录并打开用户列表", async ({ page }) => {
    await page.goto("/login?next=/admin/users");
    await expect(page.getByTestId("auth-login-submit")).toBeVisible({
      timeout: 30_000,
    });
    await page.getByLabel("邮箱").fill(ADMIN_EMAIL);
    await page.getByLabel("密码").fill(ADMIN_PASSWORD);
    await page.getByTestId("auth-login-submit").click();

    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("用户列表")).toBeVisible({ timeout: 15_000 });
  });

  test("普通用户访问 /admin 显示 403", async ({ page, request }) => {
    const email = `e2e-${Date.now()}@example.com`;
    const password = "E2eUser_12345";

    const registerRes = await request.post("/api/auth/register", {
      data: { email, password, name: "E2E User" },
    });
    expect(registerRes.ok()).toBeTruthy();

    await page.goto("/login");
    await expect(page.getByTestId("auth-login-submit")).toBeVisible({
      timeout: 30_000,
    });
    await page.getByLabel("邮箱").fill(email);
    await page.getByLabel("密码").fill(password);
    await page.getByTestId("auth-login-submit").click();

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "403 无权限" })).toBeVisible();
  });
});
