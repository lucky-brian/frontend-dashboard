"use client";

import { insertActivityLog } from "@/lib/activity-log-api";
import {
  deleteConventionLog,
  getConventionLogsByDateRange,
  type ConventionLogWithDetails,
} from "@/lib/convention-api";
import { ConventionForm } from "@/components/conversion-log/ConventionForm";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  useGetConventionFormOptionsQuery,
  useGetLatestConventionLogsQuery,
  useGetMemberConventionSummariesQuery,
} from "@/store/conventionApi";
import { EllipsisOutlined, ExportOutlined, ReloadOutlined } from "@ant-design/icons";
import { App, Button, DatePicker, Dropdown, Drawer, Modal, Select, Table, Typography } from "antd";
import type { MenuProps } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useCallback, useState } from "react";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";

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
    width: 110,
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
  const { user } = useCurrentUser();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<ConventionLogWithDetails | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportDateRange, setExportDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null]);
  const [exportMemberId, setExportMemberId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const { data: formOptions } = useGetConventionFormOptionsQuery(undefined, {
    refetchOnMountOrArgChange: false,
  });
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
          const actorName = user?.name ?? "unknown";
          const memberName =
            record.frontend_member?.name ?? record.member_id;
          const topicTitle =
            record.topic_convention_option?.title ?? record.topic_id;
          const actionLabel =
            record.action_rules?.label ?? record.action_rule_id;
          const typeLabel = TYPE_LABELS[record.type] ?? record.type;
          const parts = [
            `วันที่ ${dayjs(record.log_date).format("DD/MM/YYYY")}`,
            `สมาชิก ${memberName}`,
            `ประเภท ${typeLabel}`,
            `หัวข้อ ${topicTitle}`,
            `Action ${actionLabel}`,
          ];
          if (record.sprint) parts.push(`Sprint ${record.sprint}`);
          if (record.notes) parts.push(`หมายเหตุ ${record.notes}`);
          const contentSummary = parts.join(", ");
          await insertActivityLog({
            actor_name: actorName,
            action_type: "delete_convention_log",
            description: `ลบ Convention Log โดย ${actorName}: ${contentSummary}`,
            metadata: {
              log_id: record.id,
              deleted_convention: {
                log_date: record.log_date,
                member_name: memberName,
                type: record.type,
                topic_title: topicTitle,
                action_label: actionLabel,
                sprint: record.sprint,
                notes: record.notes,
              },
            },
          });
          toast.success("ลบสำเร็จ");
          refetch();
          refetchSummary();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
        }
      },
    });
  }, [modal, refetch, refetchSummary, user?.name]);

  const buildExcelAndDownload = useCallback(
    (logs: ConventionLogWithDetails[], startDate: string, endDate: string) => {
      const wb = XLSX.utils.book_new();

      const logsHeaders = [
        "วันที่",
        "สมาชิก",
        "ประเภท",
        "หัวข้อ",
        "Action",
        "Sprint",
        "หมายเหตุ",
        "บันทึกเมื่อ",
      ];
      const logsRows = logs.map((row) => [
        dayjs(row.log_date).format("DD/MM/YYYY"),
        row.frontend_member?.name ?? row.member_id,
        TYPE_LABELS[row.type] ?? row.type,
        row.topic_convention_option?.title ?? row.topic_id,
        row.action_rules?.label ?? row.action_rule_id,
        row.sprint ?? "",
        row.notes ?? "",
        dayjs(row.created_at).format("DD/MM/YYYY HH:mm"),
      ]);
      const wsLogs = XLSX.utils.aoa_to_sheet([logsHeaders, ...logsRows]);
      XLSX.utils.book_append_sheet(wb, wsLogs, "Logs");

      const summaryByMember = new Map<string, { name: string; count: number }>();
      for (const row of logs) {
        const name = row.frontend_member?.name ?? row.member_id;
        const prev = summaryByMember.get(row.member_id);
        if (prev) prev.count += 1;
        else summaryByMember.set(row.member_id, { name, count: 1 });
      }
      const summaryRows = Array.from(summaryByMember.entries())
        .map(([, v]) => [v.name, v.count])
        .sort((a, b) => String(a[0]).localeCompare(String(b[0])));
      const summaryHeaders = ["สมาชิก", "จำนวนครั้ง (ในช่วงที่เลือก)"];
      const wsSummary = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryRows]);
      XLSX.utils.book_append_sheet(wb, wsSummary, "Summary");

      const filename = `convention-log_${startDate}_${endDate}.xlsx`;
      XLSX.writeFile(wb, filename);
    },
    []
  );

  const onExportConfirm = useCallback(async () => {
    const [start, end] = exportDateRange;
    if (!start || !end) {
      toast.error("กรุณาเลือกช่วงวันที่");
      return;
    }
    if (end.isBefore(start)) {
      toast.error("วันที่สิ้นสุดต้องไม่ก่อนวันที่เริ่มต้น");
      return;
    }
    setExporting(true);
    try {
      const startStr = start.format("YYYY-MM-DD");
      const endStr = end.format("YYYY-MM-DD");
      let logs = await getConventionLogsByDateRange(startStr, endStr);
      if (exportMemberId) {
        logs = logs.filter((row) => row.member_id === exportMemberId);
      }
      buildExcelAndDownload(logs, startStr, endStr);
      toast.success("Export สำเร็จ");
      setExportModalOpen(false);
      setExportDateRange([null, null]);
      setExportMemberId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export ไม่สำเร็จ");
    } finally {
      setExporting(false);
    }
  }, [exportDateRange, exportMemberId, buildExcelAndDownload]);

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
        <div className="flex items-center gap-2">
          <Button
            type="default"
            size="small"
            icon={<ExportOutlined />}
            onClick={() => setExportModalOpen(true)}
          >
            Export
          </Button>
          <Button
            type="default"
            onClick={() => refetch()}
            loading={isFetching}
            size="small"
            icon={<ReloadOutlined />}
          />
        </div>
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
      <Modal
        title="Export เป็น Excel"
        open={exportModalOpen}
        onCancel={() => {
          setExportModalOpen(false);
          setExportDateRange([null, null]);
          setExportMemberId(null);
        }}
        onOk={onExportConfirm}
        okText="Export"
        confirmLoading={exporting}
      >
        <div className="space-y-4 py-2">
          <div>
            <Typography.Text className="mb-2 block text-zinc-600 dark:text-zinc-400">
              เลือกช่วงวันที่ที่ต้องการ export
            </Typography.Text>
            <DatePicker.RangePicker
              value={exportDateRange}
              onChange={(dates) => setExportDateRange(dates ?? [null, null])}
              format="DD/MM/YYYY"
              className="w-full"
              size="large"
              disabledDate={(date) => date ? date.isAfter(dayjs(), "day") : false}
            />
          </div>
          <div>
            <Typography.Text className="mb-2 block text-zinc-600 dark:text-zinc-400">
              ผู้ถูกกระทำ (กรองตามสมาชิก)
            </Typography.Text>
            <Select
              placeholder="ทั้งหมด"
              allowClear
              value={exportMemberId}
              onChange={(v) => setExportMemberId(v && v !== "" ? v : null)}
              options={[
                { value: "", label: "ทั้งหมด" },
                ...(formOptions?.memberOptions ?? []),
              ]}
              className="w-full"
              size="large"
            />
          </div>
          <Typography.Text type="secondary" className="block text-xs">
            ไฟล์ Excel จะมี 2 sheet: Logs (รายการ log ในช่วงที่เลือก) และ Summary (สรุปจำนวนครั้งต่อคนในช่วงที่เลือก)
          </Typography.Text>
        </div>
      </Modal>
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
