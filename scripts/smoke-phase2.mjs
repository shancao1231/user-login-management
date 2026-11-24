/**
 * 第 2 阶段 API 验收：登录 → /me → 登出
 * 需：`pnpm db:up` + `pnpm db:seed` + 本机 dev 或 `pnpm start`
 *
 * 用法：BASE=http://127.0.0.1:3000 node scripts/smoke-phase2.mjs
 */
const BASE = process.env.BASE ?? "http://127.0.0.1:3000";

const jar = new Map();

async function request(path, init = {}) {
  const headers = new Headers(init.headers);
  const cookie = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  if (cookie) headers.set("Cookie", cookie);

  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  for (const line of setCookie) {
    const [pair] = line.split(";");
    const [name, ...rest] = pair.split("=");
    if (name && rest.length) jar.set(name.trim(), rest.join("=").trim());
    if (/Max-Age=0/i.test(line)) {
      const n = name?.trim();
      if (n) jar.delete(n);
    }
  }
  return res;
}

const loginRes = await request("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "admin@example.com",
    password: "ChangeMe_Admin123!",
  }),
});
const loginBody = await loginRes.json();
if (!loginRes.ok) {
  console.error("login failed", loginRes.status, loginBody);
  process.exit(1);
}

const meRes = await request("/api/auth/me");
const meBody = await meRes.json();
if (!meRes.ok || !meBody.user?.email) {
  console.error("me failed", meRes.status, meBody);
  process.exit(1);
}

const logoutRes = await request("/api/auth/logout", { method: "POST" });
if (!logoutRes.ok) {
  console.error("logout failed", logoutRes.status);
  process.exit(1);
}

const meAfter = await request("/api/auth/me");
if (meAfter.status !== 401) {
  console.error("expected 401 after logout", meAfter.status);
  process.exit(1);
}

console.log("smoke:phase2 OK", { email: meBody.user.email, roles: meBody.user.roles });
