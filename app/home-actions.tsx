"use client";

import { Button, Space, message } from "antd";

export function HomeActions() {
  return (
    <Space wrap>
      <Button
        type="primary"
        onClick={() => message.success("Ant Design 已接入（步骤 0.3 验收）")}
      >
        点击验收 UI
      </Button>
      <Button disabled>登录（第 2 阶段）</Button>
      <Button disabled>管理后台（第 3 阶段）</Button>
    </Space>
  );
}
