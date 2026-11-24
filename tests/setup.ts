process.env.DATABASE_URL ??=
  "postgresql://app:app_dev_password@127.0.0.1:15432/user_login_admin?schema=public";
process.env.SESSION_SECRET ??= "vitest-placeholder-session-secret-32chars";
