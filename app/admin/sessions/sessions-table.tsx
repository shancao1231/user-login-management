"use client";

import { Button, Input, Space, Table, message } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useEffect, useState } from "react";

type SessionRow = {
  id: string;
  userId: string;
  userEmail: string;
  userStatus: string;
  ip: string | null;
  userAgent: string | null;
  expiresAt: string;
  createdAt: string;
};

export function SessionsTable() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SessionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (search) params.set("q", search);
      const res = await fetch(`/api/admin/sessions?${params}`);
      const data = (await res.json()) as {
        items?: SessionRow[];
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
  }, [page, pageSize, search, reloadToken]);

  async function revoke(id: string) {
    const res = await fetch(`/api/admin/sessions/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      message.error(data.error ?? "撤销失败");
      return;
    }
    message.success("已撤销会话");
    setLoading(true);
    setReloadToken((n) => n + 1);
  }

  const columns: ColumnsType<SessionRow> = [
    { title: "用户", dataIndex: "userEmail", key: "userEmail" },
    { title: "IP", dataIndex: "ip", key: "ip", render: (v) => v ?? "—" },
    {
      title: "UA",
      dataIndex: "userAgent",
      key: "userAgent",
      ellipsis: true,
      render: (v) => v ?? "—",
    },
    {
      title: "过期",
      dataIndex: "expiresAt",
      key: "expiresAt",
      render: (v: string) => new Date(v).toLocaleString(),
    },
    {
      title: "操作",
      key: "actions",
      render: (_, row) => (
        <Button size="small" danger onClick={() => void revoke(row.id)}>
          撤销
        </Button>
      ),
    },
  ];

  function refresh() {
    setLoading(true);
    setReloadToken((n) => n + 1);
  }

  return (
    <div className="space-y-4">
      <Space wrap>
        <Input.Search
          allowClear
          placeholder="邮箱或 IP"
          style={{ width: 260 }}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onSearch={(v) => {
            setLoading(true);
            setSearch(v);
            setPage(1);
          }}
        />
        <Button onClick={refresh}>刷新</Button>
      </Space>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={items}
        pagination={{ current: page, pageSize, total, showSizeChanger: true }}
        onChange={(pagination: TablePaginationConfig) => {
          setLoading(true);
          setPage(pagination.current ?? 1);
          setPageSize(pagination.pageSize ?? 20);
        }}
      />
    </div>
  );
}
