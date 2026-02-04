"use client";

import {
  deleteActionRule,
  getActionRules,
  getTopicConventionOptions,
  insertActionRule,
  updateActionRule,
} from "@/lib/convention-api";
import type { ActionRule, TopicConventionOption } from "@/lib/database.types";
import { Button, Form, Input, InputNumber, Modal, Select, Table } from "antd";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

type FormValues = {
  topic_id: string;
  label: string;
  value: string;
  sort_order: number;
};

export function ActionSection() {
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

  const openAdd = () => {
    setEditing(null);
    form.setFieldsValue({
      topic_id: topics[0]?.id ?? "",
      label: "",
      value: "",
      sort_order: 0,
    });
    setModalOpen(true);
  };

  const openEdit = (row: ActionRule) => {
    setEditing(row);
    form.setFieldsValue({
      topic_id: row.topic_id,
      label: row.label,
      value: row.value,
      sort_order: row.sort_order,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editing) {
        await updateActionRule(editing.id, {
          topic_id: values.topic_id,
          label: values.label,
          value: values.value,
          sort_order: values.sort_order,
        });
        toast.success("แก้ไข Action สำเร็จ");
      } else {
        await insertActionRule({
          topic_id: values.topic_id,
          label: values.label,
          value: values.value,
          sort_order: values.sort_order,
        });
        toast.success("เพิ่ม Action สำเร็จ");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (row: ActionRule) => {
    Modal.confirm({
      title: "ยืนยันการลบ",
      content: `ต้องการลบ Action "${row.label}" ใช่หรือไม่?`,
      okText: "ลบ",
      okType: "danger",
      cancelText: "ยกเลิก",
      onOk: async () => {
        try {
          await deleteActionRule(row.id);
          toast.success("ลบสำเร็จ");
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
      render: (id: string) => getTopicTitle(id),
    },
    { title: "Label", dataIndex: "label", key: "label" },
    { title: "Value", dataIndex: "value", key: "value" },
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
      <Table
        rowKey="id"
        loading={loading}
        dataSource={actions}
        columns={columns}
        pagination={false}
        size="small"
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
            label="Label (ข้อความที่แสดง)"
            rules={[{ required: true, message: "กรุณากรอก Label" }]}
          >
            <Input placeholder="เช่น ระบุ type ของ commit ไม่ถูกต้อง" />
          </Form.Item>
          <Form.Item
            name="value"
            label="Value (ค่าที่เก็บ)"
            rules={[{ required: true, message: "กรุณากรอก Value" }]}
          >
            <Input placeholder="มักใช้เหมือน Label" />
          </Form.Item>
          <Form.Item name="sort_order" label="ลำดับ" initialValue={0}>
            <InputNumber min={0} className="w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
