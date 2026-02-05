"use client";

import { ActionSection } from "@/components/convention-settings/ActionSection";
import { TopicSection } from "@/components/convention-settings/TopicSection";
import { TypeSection } from "@/components/convention-settings/TypeSection";
import { Tabs } from "antd";

export default function ConventionSettingsPage() {
  return (
    <main className="flex-1 p-6 sm:p-8 w-full">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-6">
        Setting Convention
      </h1>
      <p className="text-zinc-600 dark:text-zinc-400 text-sm mb-6">
        จัดการ Type (ประเภท), Topic (หัวข้อ), Rule (กฎภายใต้แต่ละ Topic) และ Action (ตัวเลือกข้อผิดที่ใช้ตอนบันทึก log)
      </p>
      <Tabs
        defaultActiveKey="type"
        items={[
          {
            key: "type",
            label: "Type",
            children: <TypeSection />,
          },
          {
            key: "topic",
            label: "Topic",
            children: <TopicSection />,
          },
          {
            key: "action",
            label: "Action",
            children: <ActionSection />,
          },
        ]}
      />
    </main>
  );
}
