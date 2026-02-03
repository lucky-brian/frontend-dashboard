"use client";

import { deleteConventionLog } from "@/lib/convention-api";
import type { ConventionLogWithDetails } from "@/lib/convention-api";
import {
  useGetLatestConventionLogsQuery,
  useGetMemberConventionSummariesQuery,
} from "@/store/conventionApi";
import { ConventionForm } from "@/components/conversion-log/ConventionForm";
import { EllipsisOutlined, ReloadOutlined } from "@ant-design/icons";
import { App, Button, Dropdown, Drawer, Table, Typography } from "antd";
import type { MenuProps } from "antd";
import dayjs from "dayjs";
import { useCallback, useState } from "react";
import { toast } from "react-hot-toast";

const TYPE_LABELS: Record<string, string> = {
  convention: "Convention",
  delivery: "Delivery",
};

const columnsBase = [
  {
    title: "วันที่",
    dataIndex: "log_date",
    key: "log_date",
    width: 110,
    render: (text: string) => dayjs(text).format("DD/MM/YYYY"),
  },
  {
    title: "สมาชิก",
    key: "member",
    width: 140,
    render: (_: unknown, record: ConventionLogWithDetails) =>
      record.frontend_member?.name ?? record.member_id,
  },
  {
    title: "ประเภท",
    dataIndex: "type",
    key: "type",
    width: 100,
    render: (type: string) => TYPE_LABELS[type] ?? type,
  },
  {
    title: "หัวข้อ",
    key: "topic",
    width: 160,
    render: (_: unknown, record: ConventionLogWithDetails) =>
      record.topic_convention_option?.title ?? record.topic_id,
  },
  {
    title: "Action",
    key: "action",
    width: 140,
    render: (_: unknown, record: ConventionLogWithDetails) =>
      record.action_rules?.label ?? record.action_rule_id,
  },
  {
    title: "Sprint",
    dataIndex: "sprint",
    key: "sprint",
    width: 100,
    ellipsis: true,
    render: (text: string | null) => text ?? "—",
  },
  {
    title: "หมายเหตุ",
    dataIndex: "notes",
    key: "notes",
    ellipsis: true,
    render: (text: string | null) => text ?? "—",
  },
  {
    title: "บันทึกเมื่อ",
    dataIndex: "created_at",
    key: "created_at",
    width: 160,
    render: (text: string) => dayjs(text).format("DD/MM/YYYY HH:mm"),
  },
];

export function ConventionLog() {
  const { modal } = App.useApp();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ConventionLogWithDetails | null>(null);

  const { data: logs = [], isLoading, error, refetch, isFetching } =
    useGetLatestConventionLogsQuery(undefined, {
      refetchOnMountOrArgChange: false,
    });
  const { refetch: refetchSummary } = useGetMemberConventionSummariesQuery(
    undefined,
    { refetchOnMountOrArgChange: false }
  );

  const onEdit = useCallback((record: ConventionLogWithDetails) => {
    setEditingRecord(record);
    setDrawerOpen(true);
  }, []);

  const onRemove = useCallback((record: ConventionLogWithDetails) => {
    modal.confirm({
      title: "ลบรายการ",
      content: `ต้องการลบ log วันที่ ${dayjs(record.log_date).format("DD/MM/YYYY")} ของ ${record.frontend_member?.name ?? record.member_id} ใช่หรือไม่?`,
      okText: "ลบ",
      centered: true,
      width: 600,
      okType: "danger",
      cancelText: "ยกเลิก",
      onOk: async () => {
        try {
          await deleteConventionLog(record.id);
          toast.success("ลบสำเร็จ");
          refetch();
          refetchSummary();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
        }
      },
    });
  }, [modal, refetch, refetchSummary]);

  const getActionMenuItems = (record: ConventionLogWithDetails): MenuProps["items"] => [
    { key: "edit", label: "Edit", onClick: () => onEdit(record) },
    { key: "remove", label: "Remove", danger: true, onClick: () => onRemove(record) },
  ];

  const columns = [
    ...columnsBase,
    {
      title: "",
      key: "actions",
      width: 56,
      fixed: "right" as const,
      render: (_: unknown, record: ConventionLogWithDetails) => (
        <Dropdown
          menu={{ items: getActionMenuItems(record) }}
          trigger={["click"]}
        >
          <Button type="text" size="small" icon={<EllipsisOutlined />} />
        </Dropdown>
      ),
    },
  ];

  if (error) {
    const message =
      "error" in error && typeof error.error === "string"
        ? error.error
        : "โหลดข้อมูลไม่สำเร็จ";
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
        <Typography.Text type="danger">{message}</Typography.Text>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          Convention Log ล่าสุด (10 รายการ)
        </h2>
        <Button
          type="default"
          onClick={() => refetch()}
          loading={isFetching}
          size="small"
        >
           <ReloadOutlined />
        </Button>
      </div>
      <div className="overflow-x-auto">
        <Table<ConventionLogWithDetails>
          dataSource={logs}
          columns={columns}
          rowKey="id"
          loading={isLoading}
          pagination={false}
          size="small"
          className="[&_.ant-table]:text-zinc-700 [&_.ant-table]:dark:text-zinc-300"
        />
      </div>
      <Drawer
        title="แก้ไข Convention Log"
        open={drawerOpen}
        size={500}
        onClose={() => {
          setDrawerOpen(false);
          setEditingRecord(null);
        }}
        styles={{ body: { paddingBottom: 24 } }}
      >
        {editingRecord && (
          <ConventionForm
            mode="edit"
            initialData={editingRecord}
            onSuccess={() => {
              setDrawerOpen(false);
              setEditingRecord(null);
              refetch();
            }}
            onCancel={() => {
              setDrawerOpen(false);
              setEditingRecord(null);
            }}
          />
        )}
      </Drawer>
    </div>
  );
}
