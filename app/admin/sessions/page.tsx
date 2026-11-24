import { Card } from "antd";
import { SessionsTable } from "./sessions-table";

export const dynamic = "force-dynamic";

export default function AdminSessionsPage() {
  return (
    <Card title={<span className="text-lg font-semibold">会话管理</span>}>
      <SessionsTable />
    </Card>
  );
}
