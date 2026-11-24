# 用户登录与管理后台

方案 A：**Next.js 全栈** + PostgreSQL + Prisma + Session/RBAC。进度与任务见 [`docs/开发计划.md`](docs/开发计划.md)。

## 要求

- Node.js 22+
- pnpm 9+
- Docker（本地 PostgreSQL，见 [`docs/本地数据库.md`](docs/本地数据库.md)）

## 本地启动

```bash
pnpm install
cp .env.example .env
# 生成 SESSION_SECRET：openssl rand -base64 32

pnpm db:up
pnpm dev
```

- 首页：http://localhost:3000
- 数据库探活：http://localhost:3000/api/health/db

## 常用命令

| 命令                     | 说明                           |
| ------------------------ | ------------------------------ |
| `pnpm dev`               | 开发服务器                     |
| `pnpm build`             | 生产构建                       |
| `pnpm check`             | typecheck + lint + format 检查 |
| `pnpm smoke:05`          | Zod / argon2 验收              |
| `pnpm smoke:2`           | 登录 / me / 登出 API 验收      |
| `pnpm smoke:3`           | 管理端用户 API 验收            |
| `pnpm smoke:4`           | 找回密码 + 审计 API 验收       |
| `pnpm smoke:6`           | 软删 / 会话 / 邮箱验证 API     |
| `pnpm test:unit`         | Vitest 单元测试                |
| `pnpm test:e2e`          | Playwright E2E（需 DB + seed） |
| `pnpm db:up` / `db:down` | 启停 Postgres 容器             |
| `pnpm db:migrate`        | Prisma 迁移                    |
| `pnpm db:seed`           | 种子数据                       |

## 文档

- [开发计划](docs/开发计划.md)
- [环境变量](docs/环境变量.md)
- [本地数据库](docs/本地数据库.md)
- [CI](docs/CI.md)
- [部署](docs/部署.md)
- [监控与日志](docs/监控.md)
- [第 0 阶段验收](docs/阶段0验收.md)
- [种子数据](docs/种子数据.md)

## Git

已在项目根目录初始化独立仓库（`main`）。首次提交与远程关联见 [`docs/Git仓库.md`](docs/Git仓库.md)。
