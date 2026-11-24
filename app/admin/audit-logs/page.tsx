import { Card } from "antd";
import { AuditLogsTable } from "./audit-logs-table";

export const dynamic = "force-dynamic";

export default function AuditLogsPage() {
  return (
    <Card title={<span className="text-lg font-semibold">审计日志</span>}>
      <AuditLogsTable />
    </Card>
  );
}
