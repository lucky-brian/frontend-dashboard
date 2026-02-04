"use client";

import {
  deleteConventionRule,
  getConventionRules,
  getTopicConventionOptions,
  insertConventionRule,
  updateConventionRule,
} from "@/lib/convention-api";
import type { ConventionRule, TopicConventionOption } from "@/lib/database.types";
import { Button, Form, Input, InputNumber, Modal, Select, Table } from "antd";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

type FormValues = {
  topic_id: string;
  rule_text: string;
  sort_order: number;
};

export function RuleSection() {
  const [rules, setRules] = useState<ConventionRule[]>([]);
  const [topics, setTopics] = useState<TopicConventionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ConventionRule | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rulesData, topicsData] = await Promise.all([
        getConventionRules(),
        getTopicConventionOptions(),
      ]);
      setRules(rulesData);
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
      rule_text: "",
      sort_order: 0,
    });
    setModalOpen(true);
  };

  const openEdit = (row: ConventionRule) => {
    setEditing(row);
    form.setFieldsValue({
      topic_id: row.topic_id,
      rule_text: row.rule_text,
      sort_order: row.sort_order,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editing) {
        await updateConventionRule(editing.id, {
          topic_id: values.topic_id,
          rule_text: values.rule_text,
          sort_order: values.sort_order,
        });
        toast.success("แก้ไข Rule สำเร็จ");
      } else {
        await insertConventionRule({
          topic_id: values.topic_id,
          rule_text: values.rule_text,
          sort_order: values.sort_order,
        });
        toast.success("เพิ่ม Rule สำเร็จ");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (row: ConventionRule) => {
    Modal.confirm({
      title: "ยืนยันการลบ",
      content: `ต้องการลบ Rule "${row.rule_text}" ใช่หรือไม่?`,
      okText: "ลบ",
      okType: "danger",
      cancelText: "ยกเลิก",
      onOk: async () => {
        try {
          await deleteConventionRule(row.id);
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
    { title: "ข้อความกฎ", dataIndex: "rule_text", key: "rule_text" },
    { title: "ลำดับ", dataIndex: "sort_order", key: "sort_order", width: 80 },
    {
      title: "จัดการ",
      key: "actions",
      width: 140,
      render: (_: unknown, row: ConventionRule) => (
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
          Rule (กฎภายใต้แต่ละ Topic)
        </h3>
        <Button type="primary" onClick={openAdd} disabled={topics.length === 0}>
          เพิ่ม Rule
        </Button>
      </div>
      {topics.length === 0 && !loading && (
        <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-2">
          กรุณาเพิ่ม Topic ก่อนจึงจะเพิ่ม Rule ได้
        </p>
      )}
      <Table
        rowKey="id"
        loading={loading}
        dataSource={rules}
        columns={columns}
        pagination={false}
        size="small"
      />
      <Modal
        title={editing ? "แก้ไข Rule" : "เพิ่ม Rule"}
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
            name="rule_text"
            label="ข้อความกฎ"
            rules={[{ required: true, message: "กรุณากรอกข้อความกฎ" }]}
          >
            <Input.TextArea rows={2} placeholder="ข้อความกฎที่จะแสดงใน Convention Rules" />
          </Form.Item>
          <Form.Item name="sort_order" label="ลำดับ" initialValue={0}>
            <InputNumber min={0} className="w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
