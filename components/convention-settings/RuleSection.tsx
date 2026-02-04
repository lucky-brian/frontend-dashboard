"use client";

import { insertActivityLog } from "@/lib/activity-log-api";
import {
  deleteConventionRule,
  getConventionRules,
  getTopicConventionOptions,
  insertConventionRule,
  updateConventionRule,
} from "@/lib/convention-api";
import type { ConventionRule, TopicConventionOption } from "@/lib/database.types";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { conventionApi } from "@/store/conventionApi";
import { App, Button, Form, Input, InputNumber, Modal, Select, Table } from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-hot-toast";

type FormValues = {
  topic_id: string;
  rule_text: string;
  sort_order: number;
};

export function RuleSection() {
  const { modal } = App.useApp();
  const dispatch = useDispatch();
  const { user } = useCurrentUser();
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

  /** เรียง rules ตามลำดับ topic แล้ว sort_order (สำหรับแสดง group ใน table) */
  const sortedRules = useMemo(() => {
    const order = new Map(topics.map((t, i) => [t.id, i]));
    return [...rules].sort((a, b) => {
      const oa = order.get(a.topic_id) ?? 0;
      const ob = order.get(b.topic_id) ?? 0;
      return oa === ob ? a.sort_order - b.sort_order : oa - ob;
    });
  }, [rules, topics]);

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
    const actorName = user?.name ?? "unknown";
    try {
      if (editing) {
        await updateConventionRule(editing.id, {
          topic_id: values.topic_id,
          rule_text: values.rule_text,
          sort_order: values.sort_order,
        });
        toast.success("แก้ไข Rule สำเร็จ");
        await insertActivityLog({
          actor_name: actorName,
          action_type: "setting_convention",
          description: `แก้ไข Rule (Setting Convention) โดย ${actorName}`,
          metadata: { section: "rule", id: editing.id },
        });
      } else {
        await insertConventionRule({
          topic_id: values.topic_id,
          rule_text: values.rule_text,
          sort_order: values.sort_order,
        });
        toast.success("เพิ่ม Rule สำเร็จ");
        await insertActivityLog({
          actor_name: actorName,
          action_type: "setting_convention",
          description: `เพิ่ม Rule (Setting Convention) โดย ${actorName}`,
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

  const handleDelete = (row: ConventionRule) => {
    modal.confirm({
      title: "ยืนยันการลบ",
      content: `ต้องการลบ Rule "${row.rule_text}" ใช่หรือไม่?`,
      okText: "ลบ",
      centered: true,
      okType: "danger",
      cancelText: "ยกเลิก",
      onOk: async () => {
        try {
          await deleteConventionRule(row.id);
          const actorName = user?.name ?? "unknown";
          await insertActivityLog({
            actor_name: actorName,
            action_type: "setting_convention",
            description: `ลบ Rule (Setting Convention) โดย ${actorName}`,
            metadata: { section: "rule", id: row.id },
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
      render: (_: unknown, record: ConventionRule, index: number) => {
        const isFirstInGroup =
          index === 0 ||
          sortedRules[index - 1].topic_id !== record.topic_id;
        if (isFirstInGroup) {
          const count = sortedRules.filter(
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
      <Table<ConventionRule>
        rowKey="id"
        loading={loading}
        dataSource={sortedRules}
        columns={columns}
        pagination={false}
        size="small"
        className="[&_.ant-table]:text-zinc-700 [&_.ant-table]:dark:text-zinc-300"
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
