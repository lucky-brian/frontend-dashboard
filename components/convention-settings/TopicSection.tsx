"use client";

import {
  deleteTopicConventionOption,
  getConventionTypes,
  getTopicConventionOptions,
  insertTopicConventionOption,
  updateTopicConventionOption,
} from "@/lib/convention-api";
import type { TopicConventionOptionWithType } from "@/lib/convention-api";
import type { ConventionType, TopicConventionOption } from "@/lib/database.types";
import { Button, Form, Input, InputNumber, Modal, Select, Table } from "antd";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

type FormValues = {
  title: string;
  type_id: string;
  sort_order: number;
};

export function TopicSection() {
  const [topics, setTopics] = useState<TopicConventionOptionWithType[]>([]);
  const [types, setTypes] = useState<ConventionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TopicConventionOptionWithType | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const typeOptions = types.map((t) => ({ value: t.id, label: t.label }));
  const getTypeLabel = (typeId: string) => types.find((t) => t.id === typeId)?.label ?? typeId;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [topicsData, typesData] = await Promise.all([
        getTopicConventionOptions(),
        getConventionTypes(),
      ]);
      setTopics(topicsData);
      setTypes(typesData);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "โหลดไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    form.setFieldsValue({
      title: "",
      type_id: types[0]?.id ?? "",
      sort_order: 0,
    });
    setModalOpen(true);
  };

  const openEdit = (row: TopicConventionOptionWithType) => {
    setEditing(row);
    form.setFieldsValue({
      title: row.title,
      type_id: row.type_id,
      sort_order: row.sort_order,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editing) {
        await updateTopicConventionOption(editing.id, {
          title: values.title,
          type_id: values.type_id,
          sort_order: values.sort_order,
        });
        toast.success("แก้ไข Topic สำเร็จ");
      } else {
        await insertTopicConventionOption({
          title: values.title,
          type_id: values.type_id,
          sort_order: values.sort_order,
        });
        toast.success("เพิ่ม Topic สำเร็จ");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (row: TopicConventionOption) => {
    Modal.confirm({
      title: "ยืนยันการลบ",
      content: `ต้องการลบ Topic "${row.title}" ใช่หรือไม่? การลบจะส่งผลต่อ Rule และ Action ที่ผูกอยู่`,
      okText: "ลบ",
      okType: "danger",
      cancelText: "ยกเลิก",
      onOk: async () => {
        try {
          await deleteTopicConventionOption(row.id);
          toast.success("ลบสำเร็จ");
          load();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
        }
      },
    });
  };

  const columns = [
    { title: "หัวข้อ", dataIndex: "title", key: "title" },
    {
      title: "ประเภท",
      dataIndex: "type_id",
      key: "type_id",
      render: (typeId: string) => getTypeLabel(typeId),
    },
    { title: "ลำดับ", dataIndex: "sort_order", key: "sort_order", width: 80 },
    {
      title: "จัดการ",
      key: "actions",
      width: 140,
      render: (_: unknown, row: TopicConventionOptionWithType) => (
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
          Topic (หัวข้อ Convention)
        </h3>
        <Button type="primary" onClick={openAdd}>
          เพิ่ม Topic
        </Button>
      </div>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={topics}
        columns={columns}
        pagination={false}
        size="small"
      />
      <Modal
        title={editing ? "แก้ไข Topic" : "เพิ่ม Topic"}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        okText="บันทึก"
        cancelText="ยกเลิก"
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="title"
            label="หัวข้อ"
            rules={[{ required: true, message: "กรุณากรอกหัวข้อ" }]}
          >
            <Input placeholder="เช่น Commit Message" />
          </Form.Item>
          <Form.Item
            name="type_id"
            label="ประเภท"
            rules={[{ required: true, message: "กรุณาเลือกประเภท" }]}
          >
            <Select options={typeOptions} placeholder="เลือกประเภท" />
          </Form.Item>
          <Form.Item name="sort_order" label="ลำดับ" initialValue={0}>
            <InputNumber min={0} className="w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
