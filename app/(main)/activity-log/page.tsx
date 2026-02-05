"use client";

import { getActivityLogs } from "@/lib/activity-log-api";
import { ACTIVITY_ACTION_TYPES, FRONTEND_MEMBERS } from "@/lib/constants";
import type { ColumnsType } from "antd/es/table";
import { Button, DatePicker, Modal, Select, Table, Typography } from "antd";
import type { ActivityLog } from "@/lib/database.types";
import dayjs, { type Dayjs } from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import { ExportOutlined } from "@ant-design/icons";

const MEMBER_OPTIONS = FRONTEND_MEMBERS.map((m) => ({
  value: m.name,
  label: m.name,
}));

const SETTING_CONVENTION_SUB_OPTIONS = [
  { value: "all", label: "ทั้งหมด" },
  { value: "add", label: "เพิ่ม" },
  { value: "edit", label: "แก้ไข" },
  { value: "delete", label: "ลบ" },
] as const;

const ACTION_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  ACTIVITY_ACTION_TYPES.map((t) => [t.value, t.label]),
);

const DEFAULT_LIMIT = 20;
const EXPORT_LIMIT = 5000;

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    null,
    null,
  ]);
  const [actionType, setActionType] = useState<string | undefined>(undefined);
  const [exportDateRange, setExportDateRange] = useState<
    [Dayjs | null, Dayjs | null]
  >([null, null]);
  const [exportActionType, setExportActionType] = useState<string | undefined>(
    undefined,
  );
  const [exportActorName, setExportActorName] = useState<string | undefined>(
    undefined,
  );
  const [exportSettingSub, setExportSettingSub] = useState<
    "all" | "add" | "edit" | "delete"
  >("all");

  const fetchLogs = useCallback(
    async (limit = DEFAULT_LIMIT) => {
      setLoading(true);
      try {
        const [from, to] = dateRange;
        const fromStr = from?.format("YYYY-MM-DD");
        const toStr = to?.format("YYYY-MM-DD");
        const data = await getActivityLogs({
          fromDate: fromStr,
          toDate: toStr,
          actionType: actionType || undefined,
          limit,
        });
        setLogs(data);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "โหลดไม่สำเร็จ");
        setLogs([]);
      } finally {
        setLoading(false);
      }
    },
    [dateRange, actionType],
  );

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const onExportConfirm = useCallback(async () => {
    setExporting(true);
    try {
      const [from, to] = exportDateRange;
      const fromStr = from?.format("YYYY-MM-DD");
      const toStr = to?.format("YYYY-MM-DD");
      const data = await getActivityLogs({
        fromDate: fromStr,
        toDate: toStr,
        actionType: exportActionType || undefined,
        settingConventionSub:
          exportActionType === "setting_convention" &&
          exportSettingSub !== "all"
            ? exportSettingSub
            : undefined,
        actorName: exportActorName || undefined,
        limit: EXPORT_LIMIT,
      });
      const wb = XLSX.utils.book_new();
      const headers = ["วันที่/เวลา", "ผู้ทำ", "ประเภท", "รายละเอียด"];
      const rows = data.map((row) => [
        dayjs(row.created_at).format("DD/MM/YYYY HH:mm:ss"),
        row.actor_name,
        ACTION_TYPE_LABELS[row.action_type] ?? row.action_type,
        row.description,
      ]);
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
      XLSX.utils.book_append_sheet(wb, ws, "Activity Log");
      const typeLabel =
        exportActionType && ACTION_TYPE_LABELS[exportActionType]
          ? ACTION_TYPE_LABELS[exportActionType].replaceAll(/\s+/g, "-")
          : "all";
      const actorLabel = exportActorName ?? "all";
      const filename = `activity-log_${fromStr ?? "start"}_${toStr ?? "end"}_${typeLabel}_${actorLabel}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success("Export สำเร็จ");
      setExportModalOpen(false);
      setExportDateRange([null, null]);
      setExportActionType(undefined);
      setExportSettingSub("all");
      setExportActorName(undefined);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export ไม่สำเร็จ");
    } finally {
      setExporting(false);
    }
  }, [exportDateRange, exportActionType, exportSettingSub, exportActorName]);

  const columns: ColumnsType<ActivityLog> = [
    {
      title: "วันที่/เวลา",
      dataIndex: "created_at",
      key: "created_at",
      width: 180,
      render: (text: string) => dayjs(text).format("DD/MM/YYYY HH:mm:ss"),
    },
    {
      title: "ผู้ทำ",
      dataIndex: "actor_name",
      key: "actor_name",
      width: 120,
    },
    {
      title: "ประเภท",
      dataIndex: "action_type",
      key: "action_type",
      width: 180,
      render: (type: string) => ACTION_TYPE_LABELS[type] ?? type,
    },
    {
      title: "รายละเอียด",
      dataIndex: "description",
      key: "description",
      onCell: () => ({
        style: { whiteSpace: "normal", wordBreak: "break-word" },
      }),
    },
  ];

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Typography.Title level={4} className="mb-0!">
          Activity Log (ใครทำอะไรบ้าง)
        </Typography.Title>
      </div>

      <Modal
        title="Export Log เป็น Excel"
        open={exportModalOpen}
        onCancel={() => {
          setExportModalOpen(false);
          setExportDateRange([null, null]);
          setExportActionType(undefined);
          setExportSettingSub("all");
          setExportActorName(undefined);
        }}
        onOk={onExportConfirm}
        okText="Export"
        confirmLoading={exporting}
        cancelText="ยกเลิก"
        destroyOnClose
      >
        <div className="flex flex-col gap-4 py-2">
          <div>
            <Typography.Text strong className="mb-1 block">
              วันที่
            </Typography.Text>
            <DatePicker.RangePicker
              value={exportDateRange}
              onChange={(dates) => setExportDateRange(dates ?? [null, null])}
              format="DD/MM/YYYY"
              placeholder={["วันที่เริ่ม", "วันที่สิ้นสุด"]}
              allowClear
              className="w-full"
              size="large"
            />
          </div>
          <div>
            <Typography.Text strong className="mb-1 block">
              ประเภท
            </Typography.Text>
            <Select
              placeholder="เลือกประเภท"
              allowClear
              value={exportActionType ?? null}
              onChange={(v) => {
                setExportActionType(v ?? undefined);
                setExportSettingSub("all");
              }}
              options={ACTIVITY_ACTION_TYPES.map((t) => ({
                value: t.value,
                label: t.label,
              }))}
              className="w-full"
              size="large"
            />
          </div>
          {exportActionType === "setting_convention" && (
            <div>
              <Typography.Text strong className="mb-1 block">
                รายละเอียด (Setting Convention)
              </Typography.Text>
              <Select
                placeholder="เลือก"
                value={exportSettingSub}
                onChange={(v) => setExportSettingSub(v ?? "all")}
                options={SETTING_CONVENTION_SUB_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
                className="w-full"
                size="large"
              />
            </div>
          )}
          <div>
            <Typography.Text strong className="mb-1 block">
              สมาชิก (ผู้ทำ)
            </Typography.Text>
            <Select
              placeholder="เลือกสมาชิก"
              allowClear
              value={exportActorName ?? null}
              onChange={(v) => setExportActorName(v ?? undefined)}
              options={MEMBER_OPTIONS}
              className="w-full"
              size="large"
            />
          </div>
        </div>
      </Modal>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <Typography.Text strong className="shrink-0">
            Filter:
          </Typography.Text>
          <DatePicker.RangePicker
            value={dateRange}
            onChange={(dates) => setDateRange(dates ?? [null, null])}
            format="DD/MM/YYYY"
            placeholder={["วันที่เริ่ม", "วันที่สิ้นสุด"]}
            allowClear
            size="large"
          />
          <Select
            placeholder="เลือกประเภท"
            allowClear
            value={actionType ?? null}
            onChange={(v) => setActionType(v ?? undefined)}
            options={ACTIVITY_ACTION_TYPES.map((t) => ({
              value: t.value,
              label: t.label,
            }))}
            style={{ minWidth: 200 }}
            size="large"
          />
        </div>
        <div>
          <Button
            type="default"
            size="small"
            icon={<ExportOutlined />}
            style={{ height: 40, padding: "0 16px" }}
            onClick={() => setExportModalOpen(true)}
          >
            Export
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
          <Typography.Text type="secondary">
            แสดง 20 รายการล่าสุด (ตาม filter)
          </Typography.Text>
        </div>
        <Table<ActivityLog>
          dataSource={logs}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="small"
          className="[&_.ant-table]:text-zinc-700 [&_.ant-table]:dark:text-zinc-300"
        />
      </div>
    </div>
  );
}
