# 持续集成（CI）

## 工作流

文件：`.github/workflows/ci.yml`

触发：`main` 分支的 `push` 与 `pull_request`。

## 执行步骤（quality job）

1. `pnpm install --frozen-lockfile`
2. `pnpm check`（`tsc`、`eslint`、`prettier --check`）
3. `pnpm test:unit`（Vitest，不依赖数据库）
4. `pnpm build`（使用占位环境变量，不启动 PostgreSQL）

## E2E job（`main` / PR）

依赖 **quality** 通过后运行：

1. 启动 GitHub Actions **Postgres 16** 服务
2. `prisma migrate deploy` + `db:seed`
3. `pnpm build` + Playwright（`pnpm start` + Chromium）
4. E2E job 使用 `actions/cache` 缓存 `~/.cache/ms-playwright`（**同一把 `pnpm-lock.yaml` 命中时跳过重新下载 Chromium**，仍会执行 `install --with-deps` 装系统依赖）

## 本地复现 CI

```bash
DATABASE_URL="postgresql://ci:ci@127.0.0.1:5432/ci?schema=public" \
SESSION_SECRET="ci-placeholder-session-secret-32-chars-minimum" \
pnpm check && pnpm test:unit && pnpm run build
```

## 推送到 GitHub 后

仓库 → **Actions** 页查看运行结果。首次需在 GitHub 创建空仓库并：

```bash
git remote add origin git@github.com:<你>/<仓库名>.git
git push -u origin main
```
