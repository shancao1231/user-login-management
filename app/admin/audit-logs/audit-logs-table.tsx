"use client";

import { Button, Input, Space, Table, message } from "antd";
import type { ColumnsType, TablePaginationConfig } from "antd/es/table";
import { useCallback, useEffect, useState } from "react";

type AuditRow = {
  id: string;
  action: string;
  actor: { email: string } | null;
  targetType: string | null;
  targetId: string | null;
  ip: string | null;
  createdAt: string;
};

export function AuditLogsTable() {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [action, setAction] = useState("");
  const [q, setQ] = useState("");
  const [actionFilter, setActionFilter] = useState("");
  const [qFilter, setQFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (actionFilter) params.set("action", actionFilter);
      if (qFilter) params.set("q", qFilter);
      const res = await fetch(`/api/admin/audit-logs?${params}`);
      const data = await res.json();
      if (!res.ok) {
        message.error(data.error ?? "加载失败");
        return;
      }
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, actionFilter, qFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: ColumnsType<AuditRow> = [
    {
      title: "时间",
      dataIndex: "createdAt",
      render: (v: string) => new Date(v).toLocaleString(),
    },
    { title: "动作", dataIndex: "action", key: "action" },
    {
      title: "操作人",
      key: "actor",
      render: (_, row) => row.actor?.email ?? "—",
    },
    {
      title: "目标",
      key: "target",
      render: (_, row) =>
        row.targetType ? `${row.targetType}:${row.targetId ?? ""}` : "—",
    },
    { title: "IP", dataIndex: "ip", render: (v) => v ?? "—" },
  ];

  return (
    <div className="space-y-4">
      <Space wrap>
        <Input
          placeholder="动作前缀，如 auth."
          style={{ width: 180 }}
          value={action}
          onChange={(e) => setAction(e.target.value)}
          onPressEnter={() => {
            setActionFilter(action);
            setPage(1);
          }}
        />
        <Input.Search
          placeholder="邮箱/IP/目标 ID"
          style={{ width: 220 }}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onSearch={(value) => {
            setQFilter(value);
            setPage(1);
          }}
        />
        <Button onClick={() => void load()}>刷新</Button>
      </Space>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={items}
        pagination={{ current: page, pageSize, total, showSizeChanger: true }}
        onChange={(p: TablePaginationConfig) => {
          setPage(p.current ?? 1);
          setPageSize(p.pageSize ?? 20);
        }}
      />
    </div>
  );
}
