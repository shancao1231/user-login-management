/**
 * 第 4 阶段：找回密码 + 审计 API
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
  }
  return res;
}

const forgot = await request("/api/auth/forgot-password", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email: "admin@example.com" }),
});
const forgotBody = await forgot.json();
if (!forgot.ok || !forgotBody.ok) {
  console.error("forgot-password failed", forgot.status, forgotBody);
  process.exit(1);
}

await request("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    email: "admin@example.com",
    password: "ChangeMe_Admin123!",
  }),
});

const audit = await request("/api/admin/audit-logs?page=1&pageSize=5");
const auditBody = await audit.json();
if (!audit.ok || !Array.isArray(auditBody.items)) {
  console.error("audit-logs failed", audit.status, auditBody);
  process.exit(1);
}

console.log("smoke:phase4 OK", {
  auditTotal: auditBody.total,
  forgotMessage: forgotBody.message?.slice(0, 20),
});