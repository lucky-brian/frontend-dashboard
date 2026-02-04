"use client";

import { insertActivityLog } from "@/lib/activity-log-api";
import {
  deleteActionRule,
  getActionRules,
  getTopicConventionOptions,
  insertActionRule,
  updateActionRule,
} from "@/lib/convention-api";
import type { ActionRule, TopicConventionOption } from "@/lib/database.types";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { conventionApi } from "@/store/conventionApi";
import { App, Button, Form, Input, InputNumber, Modal, Select, Table } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-hot-toast";

type FormValues = {
  topic_id: string;
  label: string;
  sort_order: number;
};

/** สร้าง value จาก label (สำหรับส่ง API) */
function labelToValue(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .replaceAll(/\s+/g, "_")
    .replaceAll(/[^a-z0-9_-]/g, "");
}

export function ActionSection() {
  const { modal } = App.useApp();
  const dispatch = useDispatch();
  const { user } = useCurrentUser();
  const [actions, setActions] = useState<ActionRule[]>([]);
  const [topics, setTopics] = useState<TopicConventionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ActionRule | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [actionsData, topicsData] = await Promise.all([
        getActionRules(),
        getTopicConventionOptions(),
      ]);
      setActions(actionsData);
      setTopics(topicsData);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const topicOptions = topics.map((t) => ({ value: t.id, label: t.title }));
  const getTopicTitle = (topicId: string) =>
    topics.find((t) => t.id === topicId)?.title ?? topicId;

  /** เรียง actions ตามลำดับ topic แล้ว sort_order (สำหรับแสดง group ใน table) */
  const sortedActions = useMemo(() => {
    const order = new Map(topics.map((t, i) => [t.id, i]));
    return [...actions].sort((a, b) => {
      const oa = order.get(a.topic_id) ?? 0;
      const ob = order.get(b.topic_id) ?? 0;
      return oa === ob ? a.sort_order - b.sort_order : oa - ob;
    });
  }, [actions, topics]);

  const openAdd = () => {
    setEditing(null);
    form.setFieldsValue({
      topic_id: topics[0]?.id ?? "",
      label: "",
      sort_order: 0,
    });
    setModalOpen(true);
  };

  const openEdit = (row: ActionRule) => {
    setEditing(row);
    form.setFieldsValue({
      topic_id: row.topic_id,
      label: row.label,
      sort_order: row.sort_order,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSaving(true);
    const actorName = user?.name ?? "unknown";
    try {
      if (editing) {
        const value = labelToValue(values.label);
        await updateActionRule(editing.id, {
          topic_id: values.topic_id,
          label: values.label,
          value,
          sort_order: values.sort_order,
        });
        toast.success("แก้ไข Action สำเร็จ");
        await insertActivityLog({
          actor_name: actorName,
          action_type: "setting_convention",
          description: `แก้ไข Action (Setting Convention) โดย ${actorName}`,
          metadata: { section: "action", id: editing.id },
        });
      } else {
        const value = labelToValue(values.label);
        await insertActionRule({
          topic_id: values.topic_id,
          label: values.label,
          value,
          sort_order: values.sort_order,
        });
        toast.success("เพิ่ม Action สำเร็จ");
        await insertActivityLog({
          actor_name: actorName,
          action_type: "setting_convention",
          description: `เพิ่ม Action (Setting Convention) โดย ${actorName}`,
        });
      }
      dispatch(conventionApi.util.invalidateTags(["ConventionFormOptions"]));
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (row: ActionRule) => {
    modal.confirm({
      title: "ยืนยันการลบ",
      content: `ต้องการลบ Action "${row.label}" ใช่หรือไม่?`,
      okText: "ลบ",
      centered: true,
      okType: "danger",
      cancelText: "ยกเลิก",
      onOk: async () => {
        try {
          await deleteActionRule(row.id);
          const actorName = user?.name ?? "unknown";
          await insertActivityLog({
            actor_name: actorName,
            action_type: "setting_convention",
            description: `ลบ Action (Setting Convention) โดย ${actorName}`,
            metadata: { section: "action", id: row.id },
          });
          toast.success("ลบสำเร็จ");
          dispatch(conventionApi.util.invalidateTags(["ConventionFormOptions"]));
          load();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
        }
      },
    });
  };

  const columns = [
    {
      title: "Topic",
      dataIndex: "topic_id",
      key: "topic_id",
      width: 180,
      render: (_: unknown, record: ActionRule, index: number) => {
        const isFirstInGroup =
          index === 0 ||
          sortedActions[index - 1].topic_id !== record.topic_id;
        if (isFirstInGroup) {
          const count = sortedActions.filter(
            (r) => r.topic_id === record.topic_id
          ).length;
          return {
            children: (
              <span className="font-medium text-zinc-800 dark:text-zinc-200">
                {getTopicTitle(record.topic_id)}
              </span>
            ),
            props: { rowSpan: count },
          };
        }
        return { props: { rowSpan: 0 } };
      },
    },
    { title: "Label", dataIndex: "label", key: "label" },
    { title: "ลำดับ", dataIndex: "sort_order", key: "sort_order", width: 80 },
    {
      title: "จัดการ",
      key: "actions",
      width: 140,
      render: (_: unknown, row: ActionRule) => (
        <>
          <Button type="link" size="small" onClick={() => openEdit(row)}>
            แก้ไข
          </Button>
          <Button
            type="link"
            size="small"
            danger
            onClick={() => handleDelete(row)}
          >
            ลบ
          </Button>
        </>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200">
          Action (ตัวเลือกข้อผิดที่เลือกได้ตอนบันทึก log)
        </h3>
        <Button type="primary" onClick={openAdd} disabled={topics.length === 0}>
          เพิ่ม Action
        </Button>
      </div>
      {topics.length === 0 && !loading && (
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-2">
          กรุณาเพิ่ม Topic ก่อนจึงจะเพิ่ม Action ได้
        </p>
      )}
      <Table<ActionRule>
        rowKey="id"
        loading={loading}
        dataSource={sortedActions}
        columns={columns}
        pagination={false}
        size="small"
        className="[&_.ant-table]:text-zinc-700 [&_.ant-table]:dark:text-zinc-300"
      />
      <Modal
        title={editing ? "แก้ไข Action" : "เพิ่ม Action"}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        okText="บันทึก"
        cancelText="ยกเลิก"
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="topic_id"
            label="Topic"
            rules={[{ required: true, message: "กรุณาเลือก Topic" }]}
          >
            <Select options={topicOptions} placeholder="เลือก Topic" />
          </Form.Item>
          <Form.Item
            name="label"
            label="Label"
            rules={[{ required: true, message: "กรุณากรอก Label" }]}
          >
            <Input placeholder="เช่น ระบุ type ของ commit ไม่ถูกต้อง" />
          </Form.Item>
          <Form.Item name="sort_order" label="ลำดับ" initialValue={0}>
            <InputNumber min={0} className="w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
