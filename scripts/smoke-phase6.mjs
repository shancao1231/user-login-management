/**
 * 第 6 阶段：软删 / 恢复、会话列表、邮箱验证 resend（需登录）
 * BASE=http://127.0.0.1:3000 node scripts/smoke-phase6.mjs
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
if (!loginRes.ok) {
  console.error("admin login failed", loginRes.status);
  process.exit(1);
}

const usersRes = await request("/api/admin/users?pageSize=5");
const usersBody = await usersRes.json();
const victim = (usersBody.items ?? []).find(
  (u) => u.email !== "admin@example.com" && !u.deletedAt,
);
if (!victim) {
  console.log("smoke:6 skip soft-delete (no second user)");
} else {
  const delRes = await request(`/api/admin/users/${victim.id}`, { method: "DELETE" });
  if (!delRes.ok) {
    console.error("soft delete failed", delRes.status, await delRes.json());
    process.exit(1);
  }
  const restoreRes = await request(`/api/admin/users/${victim.id}/restore`, {
    method: "POST",
  });
  if (!restoreRes.ok) {
    console.error("restore failed", restoreRes.status, await restoreRes.json());
    process.exit(1);
  }
}

const sessionsRes = await request("/api/admin/sessions?pageSize=5");
const sessionsBody = await sessionsRes.json();
if (!sessionsRes.ok || !Array.isArray(sessionsBody.items)) {
  console.error("sessions list failed", sessionsRes.status, sessionsBody);
  process.exit(1);
}

const resendRes = await request("/api/auth/resend-verification", { method: "POST" });
const resendBody = await resendRes.json();
if (!resendRes.ok && !resendBody.alreadyVerified) {
  console.error("resend verification failed", resendRes.status, resendBody);
  process.exit(1);
}

console.log("smoke:6 OK", {
  sessions: sessionsBody.items.length,
  resend: resendBody.alreadyVerified ? "alreadyVerified" : "sent",
});