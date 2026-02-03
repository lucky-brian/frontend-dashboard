"use client";

import { useGetMemberConventionSummariesQuery } from "@/store/conventionApi";
import { Card, Typography } from "antd";

export function ConventionSummary() {
  const {
    data: items = [],
    isLoading,
    error,
  } = useGetMemberConventionSummariesQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });

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
          Convention Summary
        </h2>
      </div>
      <div className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} loading className="min-h-[100px]" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <Typography.Text className="text-zinc-500 dark:text-zinc-400">
            ยังไม่มีข้อมูลสมาชิก
          </Typography.Text>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item) => (
              <Card
                key={item.member_id}
                size="small"
                className="border-zinc-200 dark:border-zinc-700"
              >
                <div className="flex flex-col gap-1">
                  <Typography.Text
                    strong
                    className="truncate text-zinc-900 dark:text-zinc-50"
                  >
                    {item.name}
                  </Typography.Text>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
                      {item.violation_count}
                    </span>
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      ครั้ง
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
