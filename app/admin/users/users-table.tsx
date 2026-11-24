"use client";

import { UserStatus } from "@prisma/client";
import { Button, Input, Select, Space, Switch, Table, Tag, message } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import Link from "next/link";
import { useEffect, useState } from "react";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  status: UserStatus;
  deletedAt: string | null;
  lastLoginAt: string | null;
  roles: { code: string; name: string }[];
};

const statusColors: Record<UserStatus, string> = {
  ACTIVE: "green",
  DISABLED: "red",
  PENDING: "gold",
};

export function UsersTable() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<UserStatus | undefined>();
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (search) params.set("q", search);
      if (status) params.set("status", status);
      if (includeDeleted) params.set("includeDeleted", "true");
      const res = await fetch(`/api/admin/users?${params}`);
      const data = (await res.json()) as {
        items?: UserRow[];
        total?: number;
        error?: string;
      };
      if (cancelled) return;
      if (!res.ok) {
        message.error(data.error ?? "加载失败");
        setLoading(false);
        return;
      }
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [page, pageSize, search, status, includeDeleted, reloadToken]);

  const columns: ColumnsType<UserRow> = [
    {
      title: "邮箱",
      dataIndex: "email",
      key: "email",
      render: (email, row) => (
        <span>
          {email}
          {row.deletedAt ? (
            <Tag color="default" className="ml-2">
              已软删
            </Tag>
          ) : null}
        </span>
      ),
    },
    { title: "姓名", dataIndex: "name", key: "name", render: (v) => v ?? "—" },
    {
      title: "状态",
      dataIndex: "status",
      key: "status",
      render: (s: UserStatus) => <Tag color={statusColors[s]}>{s}</Tag>,
    },
    {
      title: "角色",
      key: "roles",
      render: (_, row) => row.roles.map((r) => r.code).join(", ") || "—",
    },
    {
      title: "操作",
      key: "actions",
      render: (_, row) => (
        <Link href={`/admin/users/${row.id}`} className="text-blue-600">
          详情
        </Link>
      ),
    },
  ];

  const onTableChange = (pagination: TablePaginationConfig) => {
    setLoading(true);
    setPage(pagination.current ?? 1);
    setPageSize(pagination.pageSize ?? 20);
  };

  function refresh() {
    setLoading(true);
    setReloadToken((n) => n + 1);
  }

  return (
    <div className="space-y-4">
      <Space wrap>
        <Input.Search
          allowClear
          placeholder="搜索邮箱/姓名"
          style={{ width: 260 }}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onSearch={(value) => {
            setLoading(true);
            setSearch(value);
            setPage(1);
          }}
        />
        <Select
          allowClear
          placeholder="状态"
          style={{ width: 140 }}
          value={status}
          onChange={(v) => {
            setLoading(true);
            setStatus(v);
            setPage(1);
          }}
          options={[
            { value: "ACTIVE", label: "ACTIVE" },
            { value: "DISABLED", label: "DISABLED" },
            { value: "PENDING", label: "PENDING" },
          ]}
        />
        <span className="flex items-center gap-2 text-sm">
          含软删
          <Switch
            checked={includeDeleted}
            onChange={(v) => {
              setLoading(true);
              setIncludeDeleted(v);
              setPage(1);
            }}
          />
        </span>
        <Button onClick={refresh}>刷新</Button>
      </Space>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={items}
        pagination={{ current: page, pageSize, total, showSizeChanger: true }}
        onChange={onTableChange}
      />
    </div>
  );
}
