/**
 * 可选 Sentry：设置 SENTRY_DSN 后安装 `@sentry/nextjs` 并按官方文档接入。
 * 当前仅占位，避免未配置时增加构建体积。
 */
export async function register() {
  if (!process.env.SENTRY_DSN) {
    return;
  }
  // eslint-disable-next-line no-console -- 部署期提示
  console.warn(
    "[instrumentation] 已设置 SENTRY_DSN，请按 docs/监控.md 完成 @sentry/nextjs 集成",
  );
}