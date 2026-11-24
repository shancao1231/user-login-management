import { AntdRegistry } from "@ant-design/nextjs-registry";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AntdAppProvider } from "./antd-app-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "用户登录与管理后台",
  description: "方案 A：Next.js 全栈用户认证与 RBAC 管理后台",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <AntdRegistry>
          <AntdAppProvider>{children}</AntdAppProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
