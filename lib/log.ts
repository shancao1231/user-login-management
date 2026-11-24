import "server-only";

import pino from "pino";

const level =
  process.env.LOG_LEVEL ??
  (process.env.NODE_ENV === "production" ? "info" : "debug");

export const log = pino({
  level,
  base: { service: "user-login-admin" },
  redact: ["password", "token", "passwordHash", "tokenHash"],
});