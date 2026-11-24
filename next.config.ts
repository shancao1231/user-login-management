import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  /* config options here */
  // 登录/管理后台以动态渲染为主，避免静态预渲染与 antd 客户端初始化冲突
  cacheComponents: false,
  partialPrefetching: false,
  serverExternalPackages: ["argon2"],
  turbopack: {
    root: projectRoot,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
