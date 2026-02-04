"use client";

import { insertActivityLog } from "@/lib/activity-log-api";
import {
  deleteConventionType,
  getConventionTypes,
  insertConventionType,
  updateConventionType,
} from "@/lib/convention-api";
import type { ConventionType } from "@/lib/database.types";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { conventionApi } from "@/store/conventionApi";
import { App, Button, Form, Input, InputNumber, Modal, Table } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "react-hot-toast";

type FormValues = {
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

export function TypeSection() {
  const { modal } = App.useApp();
  const dispatch = useDispatch();
  const { user } = useCurrentUser();
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
    form.setFieldsValue({ label: "", sort_order: types.length });
    setModalOpen(true);
  };

  const openEdit = (row: ConventionType) => {
    setEditing(row);
    form.setFieldsValue({
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
        await updateConventionType(editing.id, {
          value,
          label: values.label,
          sort_order: values.sort_order,
        });
        toast.success("แก้ไข Type สำเร็จ");
        await insertActivityLog({
          actor_name: actorName,
          action_type: "setting_convention",
          description: `แก้ไข Type (Setting Convention) โดย ${actorName}`,
          metadata: { section: "type", id: editing.id },
        });
      } else {
        const value = labelToValue(values.label);
        await insertConventionType({
          value,
          label: values.label,
          sort_order: values.sort_order,
        });
        toast.success("เพิ่ม Type สำเร็จ");
        await insertActivityLog({
          actor_name: actorName,
          action_type: "setting_convention",
          description: `เพิ่ม Type (Setting Convention) โดย ${actorName}`,
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

  const handleDelete = (row: ConventionType) => {
    modal.confirm({
      title: "ยืนยันการลบ",
      content: `ต้องการลบ Type "${row.label}" ใช่หรือไม่? ถ้ามี Topic ใช้ type นี้อยู่จะลบไม่ได้`,
      okText: "ลบ",
      centered: true,
      okType: "danger",
      cancelText: "ยกเลิก",
      onOk: async () => {
        try {
          await deleteConventionType(row.id);
          const actorName = user?.name ?? "unknown";
          await insertActivityLog({
            actor_name: actorName,
            action_type: "setting_convention",
            description: `ลบ Type (Setting Convention) โดย ${actorName}`,
            metadata: { section: "type", id: row.id },
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
    { title: "Type", dataIndex: "label", key: "label" },
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
            name="label"
            label="Label"
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
