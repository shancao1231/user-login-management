import { expect, test } from "@playwright/test";

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "ChangeMe_Admin123!";

test.describe("登录与管理后台", () => {
  test("超级管理员可登录并打开用户列表", async ({ page }) => {
    await page.goto("/login?next=/admin/users");
    await page.getByLabel("邮箱").fill(ADMIN_EMAIL);
    await page.getByLabel("密码").fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: "登录" }).click();

    await expect(page).toHaveURL(/\/admin\/users/);
    await expect(page.getByText("用户列表")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(ADMIN_EMAIL)).toBeVisible();
  });

  test("普通用户访问 /admin 显示 403", async ({ page }) => {
    const email = `e2e-${Date.now()}@example.com`;
    const password = "E2eUser_12345";

    await page.goto("/register");
    await page.getByLabel("邮箱").fill(email);
    await page.getByLabel("密码", { exact: true }).fill(password);
    await page.getByLabel("确认密码").fill(password);
    await page.getByRole("button", { name: "注册" }).click();
    await expect(page).toHaveURL(/\/profile/, { timeout: 15_000 });

    await page.goto("/admin");
    await expect(page.getByRole("heading", { name: "403 无权限" })).toBeVisible();
  });
});