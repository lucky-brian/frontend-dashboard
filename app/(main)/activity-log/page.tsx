"use client";

import { getActivityLogs } from "@/lib/activity-log-api";
import { ACTIVITY_ACTION_TYPES } from "@/lib/constants";
import type { ColumnsType } from "antd/es/table";
import { Button, DatePicker, Select, Table, Typography } from "antd";
import type { ActivityLog } from "@/lib/database.types";
import dayjs, { type Dayjs } from "dayjs";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";

const ACTION_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  ACTIVITY_ACTION_TYPES.map((t) => [t.value, t.label])
);

const DEFAULT_LIMIT = 20;
const EXPORT_LIMIT = 5000;

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([
    null,
    null,
  ]);
  const [actionType, setActionType] = useState<string | undefined>(undefined);

  const fetchLogs = useCallback(async (limit = DEFAULT_LIMIT) => {
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
  }, [dateRange, actionType]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const onExport = useCallback(async () => {
    setExporting(true);
    try {
      const [from, to] = dateRange;
      const fromStr = from?.format("YYYY-MM-DD");
      const toStr = to?.format("YYYY-MM-DD");
      const data = await getActivityLogs({
        fromDate: fromStr,
        toDate: toStr,
        actionType: actionType || undefined,
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
      const label =
        actionType && ACTION_TYPE_LABELS[actionType]
          ? ACTION_TYPE_LABELS[actionType].replaceAll(/\s+/g, "-")
          : "all";
      const filename = `activity-log_${fromStr ?? "start"}_${toStr ?? "end"}_${label}.xlsx`;
      XLSX.writeFile(wb, filename);
      toast.success("Export สำเร็จ");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Export ไม่สำเร็จ");
    } finally {
      setExporting(false);
    }
  }, [dateRange, actionType]);

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
      render: (type: string) =>
        ACTION_TYPE_LABELS[type] ?? type,
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
        <Button
          type="primary"
          loading={exporting}
          onClick={onExport}
        >
          Export Log เป็น Excel
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <Typography.Text strong className="shrink-0">
          Filter:
        </Typography.Text>
        <DatePicker.RangePicker
          value={dateRange}
          onChange={(dates) => setDateRange(dates ?? [null, null])}
          format="DD/MM/YYYY"
          placeholder={["วันที่เริ่ม", "วันที่สิ้นสุด"]}
          allowClear
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
        />
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
