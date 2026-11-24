/**
 * 第 3 阶段：管理员 API 验收
 * 用法：BASE=http://127.0.0.1:3000 node scripts/smoke-phase3.mjs
 */
const BASE = process.env.BASE ?? "http://127.0.0.1:3000";
const jar = new Map();

async function request(path, init = {}) {
  const headers = new Headers(init.headers);
  const cookie = [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
  if (cookie) headers.set("Cookie", cookie);
  const res = await fetch(`${BASE}${path}`, { ...init, headers });
  for (const line of res.headers.getSetCookie?.() ?? []) {
    const [pair] = line.split(";");
    const eq = pair.indexOf("=");
    if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    if (/Max-Age=0/i.test(line)) jar.delete(pair.slice(0, eq).trim());
  }
  return res;
}

const login = await request("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "admin@example.com",
    password: "ChangeMe_Admin123!",
  }),
});
if (!login.ok) {
  console.error("admin login failed", login.status);
  process.exit(1);
}

const list = await request("/api/admin/users?page=1&pageSize=5");
const listBody = await list.json();
if (!list.ok || !Array.isArray(listBody.items)) {
  console.error("list users failed", list.status, listBody);
  process.exit(1);
}

const normal = listBody.items.find((u) => u.roles?.some((r) => r.code === "user"));
if (normal) {
  const disable = await request(`/api/admin/users/${normal.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "DISABLED" }),
  });
  if (!disable.ok) {
    const err = await disable.json();
    console.error("disable user failed", disable.status, err);
    process.exit(1);
  }
  await request(`/api/admin/users/${normal.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status: "ACTIVE" }),
  });
}

console.log("smoke:phase3 OK", { userCount: listBody.total });
