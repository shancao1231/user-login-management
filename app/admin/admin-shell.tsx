"use client";

import { Layout, Menu } from "antd";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const { Header, Sider, Content } = Layout;

export function AdminShell({
  email,
  permissions,
  children,
}: {
  email: string;
  permissions: string[];
  children: ReactNode;
}) {
  const pathname = usePathname();
  const canReadUsers = permissions.includes("user:read");
  const canReadAudit = permissions.includes("audit:read");
  const canManageRoles = permissions.includes("role:manage");

  const items = [
    { key: "/admin", label: <Link href="/admin">概览</Link> },
    ...(canReadUsers
      ? [
          { key: "/admin/users", label: <Link href="/admin/users">用户</Link> },
          {
            key: "/admin/sessions",
            label: <Link href="/admin/sessions">会话</Link>,
          },
        ]
      : []),
    ...(canManageRoles
      ? [{ key: "/admin/roles", label: <Link href="/admin/roles">角色权限</Link> }]
      : []),
    ...(canReadAudit
      ? [
          {
            key: "/admin/audit-logs",
            label: <Link href="/admin/audit-logs">审计日志</Link>,
          },
        ]
      : []),
  ];

  return (
    <Layout className="min-h-[calc(100vh-0px)]">
      <Sider breakpoint="lg" collapsedWidth={0} theme="light" className="border-r">
        <div className="px-4 py-4 text-sm font-semibold text-zinc-800">管理后台</div>
        <Menu mode="inline" selectedKeys={[pathname]} items={items} />
      </Sider>
      <Layout>
        <Header className="flex items-center justify-end border-b bg-white px-6">
          <span className="text-sm text-zinc-600">{email}</span>
        </Header>
        <Content className="bg-zinc-50 p-6">{children}</Content>
      </Layout>
    </Layout>
  );
}
