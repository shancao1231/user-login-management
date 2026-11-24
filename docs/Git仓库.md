# Git 仓库

本目录为**独立 Git 仓库**（与上级 `山草项目开发/` 的 Git 分离）。

## 分支

- 默认分支：`main`

## 首次提交（需你本地执行）

```bash
cd "/Users/huamu/Documents/山草项目开发/用户登陆管理"
git add .
git status   # 确认：无 .env、无 node_modules、无 .next
git commit -m "chore: 第 0 阶段工程骨架（Next.js + Prisma + Ant Design）"
```

## 提交前自检

```bash
pnpm check
pnpm run build
git status
```

## 切勿提交

- `.env` 及任何含密钥的文件
- `node_modules`、`.next`（已在 `.gitignore`）

## 关联远程（可选）

```bash
git remote add origin <你的仓库 URL>
git push -u origin main
```

推送后 GitHub **Actions** 将自动运行 CI，说明见 [`docs/CI.md`](CI.md)。
