"use client";

import {
  deleteConventionType,
  getConventionTypes,
  insertConventionType,
  updateConventionType,
} from "@/lib/convention-api";
import type { ConventionType } from "@/lib/database.types";
import { Button, Form, Input, InputNumber, Modal, Table } from "antd";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";

type FormValues = {
  value: string;
  label: string;
  sort_order: number;
};

export function TypeSection() {
  const [types, setTypes] = useState<ConventionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ConventionType | null>(null);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<FormValues>();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getConventionTypes();
      setTypes(data);
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
    form.setFieldsValue({ value: "", label: "", sort_order: types.length });
    setModalOpen(true);
  };

  const openEdit = (row: ConventionType) => {
    setEditing(row);
    form.setFieldsValue({
      value: row.value,
      label: row.label,
      sort_order: row.sort_order,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editing) {
        await updateConventionType(editing.id, {
          value: values.value,
          label: values.label,
          sort_order: values.sort_order,
        });
        toast.success("แก้ไข Type สำเร็จ");
      } else {
        await insertConventionType({
          value: values.value,
          label: values.label,
          sort_order: values.sort_order,
        });
        toast.success("เพิ่ม Type สำเร็จ");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (row: ConventionType) => {
    Modal.confirm({
      title: "ยืนยันการลบ",
      content: `ต้องการลบ Type "${row.label}" (${row.value}) ใช่หรือไม่? ถ้ามี Topic ใช้ type นี้อยู่จะลบไม่ได้`,
      okText: "ลบ",
      okType: "danger",
      cancelText: "ยกเลิก",
      onOk: async () => {
        try {
          await deleteConventionType(row.id);
          toast.success("ลบสำเร็จ");
          load();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "ลบไม่สำเร็จ");
        }
      },
    });
  };

  const columns = [
    { title: "Value", dataIndex: "value", key: "value" },
    { title: "Label", dataIndex: "label", key: "label" },
    { title: "ลำดับ", dataIndex: "sort_order", key: "sort_order", width: 80 },
    {
      title: "จัดการ",
      key: "actions",
      width: 140,
      render: (_: unknown, row: ConventionType) => (
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
          Type (ประเภทหัวข้อ convention)
        </h3>
        <Button type="primary" onClick={openAdd}>
          เพิ่ม Type
        </Button>
      </div>
      <Table
        rowKey="id"
        loading={loading}
        dataSource={types}
        columns={columns}
        pagination={false}
        size="small"
      />
      <Modal
        title={editing ? "แก้ไข Type" : "เพิ่ม Type"}
        open={modalOpen}
        onOk={handleSubmit}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        okText="บันทึก"
        cancelText="ยกเลิก"
      >
        <Form form={form} layout="vertical" className="mt-4">
          <Form.Item
            name="value"
            label="Value (ค่าที่เก็บใน DB)"
            rules={[{ required: true, message: "กรุณากรอก value" }]}
          >
            <Input placeholder="เช่น convention, delivery" />
          </Form.Item>
          <Form.Item
            name="label"
            label="Label (ข้อความที่แสดง)"
            rules={[{ required: true, message: "กรุณากรอก label" }]}
          >
            <Input placeholder="เช่น Convention, Delivery" />
          </Form.Item>
          <Form.Item name="sort_order" label="ลำดับ" initialValue={0}>
            <InputNumber min={0} className="w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
