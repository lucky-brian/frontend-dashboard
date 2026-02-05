"use client";

import { insertActivityLog } from "@/lib/activity-log-api";
import {
  insertConventionLog,
  updateConventionLog,
  type ConventionLogWithDetails,
} from "@/lib/convention-api";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useConventionFormOptions } from "@/hooks/useConventionFormOptions";
import { Button, DatePicker, Form, Input, Select, Skeleton } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";

const { TextArea } = Input;

export type ReduxPointFormValues = {
  date: Dayjs | null;
  member: string;
  type: string;
  topicRule: string;
  sprint: string;
  action: string;
  notes: string;
};

function getDefaultValues(
  initial?: ConventionLogWithDetails | null,
): ReduxPointFormValues {
  if (initial) {
    return {
      date: dayjs(initial.log_date),
      member: initial.member_id,
      type: initial.type,
      topicRule: initial.topic_id,
      sprint: initial.sprint ?? "",
      action: initial.action_rule_id,
      notes: initial.notes ?? "",
    };
  }
  return {
    date: dayjs(),
    member: "",
    type: "",
    topicRule: "",
    sprint: "",
    action: "",
    notes: "",
  };
}

export type ConventionFormProps = {
  mode?: "create" | "edit";
  initialData?: ConventionLogWithDetails | null;
  onSuccess?: () => void;
  onCancel?: () => void;
};

export function ConventionForm({
  mode = "create",
  initialData = null,
  onSuccess,
  onCancel,
}: Readonly<ConventionFormProps>) {
  const { user } = useCurrentUser();
  const {
    memberOptions,
    typeOptions,
    getTopicOptions,
    getActionOptions,
    isLoading,
    error,
  } = useConventionFormOptions();

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReduxPointFormValues>({
    defaultValues: getDefaultValues(initialData),
    mode: "onChange",
  });

  useEffect(() => {
    reset(getDefaultValues(initialData));
  }, [initialData, reset]);

  const selectedType = watch("type");
  const selectedTopicId = watch("topicRule");
  const topicOptions = getTopicOptions(selectedType ?? "");
  const actionOptions = getActionOptions(selectedTopicId ?? "");

  const onSave = async (data: ReduxPointFormValues) => {
    const date = data.date ?? dayjs();
    const actorName = user?.name ?? "unknown";
    const params = {
      log_date: date.format("YYYY-MM-DD"),
      member_id: data.member,
      type: data.type as "convention" | "delivery",
      topic_id: data.topicRule,
      action_rule_id: data.action,
      sprint: data.sprint || null,
      notes: data.notes || null,
      created_by: actorName,
    };
    try {
      const memberName =
        memberOptions.find((m) => m.value === data.member)?.label ??
        data.member;
      const typeLabel =
        typeOptions.find((t) => t.value === data.type)?.label ?? data.type;
      const topicTitle =
        topicOptions.find((t) => t.value === data.topicRule)?.label ??
        data.topicRule;
      const actionLabel =
        actionOptions.find((a) => a.value === data.action)?.label ??
        data.action;
      const parts = [
        `วันที่ ${date.format("DD/MM/YYYY")}`,
        `สมาชิก ${memberName}`,
        `ประเภท ${typeLabel}`,
        `หัวข้อ ${topicTitle}`,
        `Action ${actionLabel}`,
      ];
      if (data.sprint) parts.push(`Sprint ${data.sprint}`);
      if (data.notes) parts.push(`หมายเหตุ ${data.notes}`);
      const contentSummary = parts.join(", ");

      if (mode === "edit" && initialData?.id) {
        await updateConventionLog(initialData.id, params);
        toast.success("แก้ไขสำเร็จ");
        await insertActivityLog({
          actor_name: actorName,
          action_type: "edit_convention_log",
          description: `แก้ไข Convention โดย ${actorName}`,
          metadata: { log_id: initialData.id },
        });
        await insertActivityLog({
          actor_name: actorName,
          action_type: "edit_convention_log",
          description: `แก้ไข Convention โดย ${actorName}: ${contentSummary}`,
          metadata: {
            added_convention: {
              log_date: params.log_date,
              member_name: memberName,
              type: params.type,
              topic_title: topicTitle,
              action_label: actionLabel,
              sprint: params.sprint,
              notes: params.notes,
            },
          },
        });
      } else {
        await insertConventionLog(params);
        toast.success("บันทึกสำเร็จ");

        await insertActivityLog({
          actor_name: actorName,
          action_type: "add_convention_log",
          description: `เพิ่ม Convention โดย ${actorName}: ${contentSummary}`,
          metadata: {
            added_convention: {
              log_date: params.log_date,
              member_name: memberName,
              type: params.type,
              topic_title: topicTitle,
              action_label: actionLabel,
              sprint: params.sprint,
              notes: params.notes,
            },
          },
        });
      }
      reset(getDefaultValues(null));
      onSuccess?.();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "บันทึกไม่สำเร็จ");
    }
  };

  const handleCancel = () => {
    reset(getDefaultValues(initialData));
    onCancel?.();
  };

  if (error) {
    return (
      <div className="w-1/2 rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-950">
        <p className="text-red-700 dark:text-red-300">{error}</p>
      </div>
    );
  }

  const isEdit = mode === "edit";
  const formWrapperClass = isEdit
    ? "w-full"
    : "w-1/2 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900";

  return (
    <div className={formWrapperClass}>
      {isLoading ? (
        <div className="flex flex-col space-y-8">
          <div className="flex flex-col gap-3">
            <Skeleton.Input
              active
              block
              size="large"
              style={{ height: "20px", width: "100px" }}
            />
            <Skeleton.Input active block size="large" />
          </div>

          <div className="flex flex-col gap-3">
            <Skeleton.Input
              active
              block
              size="large"
              style={{ height: "20px", width: "100px" }}
            />
            <Skeleton.Input active block size="large" />
          </div>

          <div className="flex flex-col gap-3">
            <Skeleton.Input
              active
              block
              size="large"
              style={{ height: "20px", width: "100px" }}
            />
            <Skeleton.Input active block size="large" />
          </div>

          <div className="flex flex-col gap-3">
            <Skeleton.Input
              active
              block
              size="large"
              style={{ height: "20px", width: "100px" }}
            />
            <Skeleton.Input active block size="large" />
          </div>

          <div className="flex flex-col gap-3">
            <Skeleton.Input
              active
              block
              size="large"
              style={{ height: "20px", width: "100px" }}
            />
            <Skeleton.Input active block size="large" />
          </div>

          <div className="flex flex-col gap-3">
            <Skeleton.Input
              active
              block
              size="large"
              style={{ height: "20px", width: "100px" }}
            />
            <Skeleton.Input
              active
              block
              size="large"
              style={{ height: "100px" }}
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Skeleton.Button active size="large" />
            <Skeleton.Button active size="large" />
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSave)} className="flex flex-col gap-0">
          <Form
            component="div"
            layout="vertical"
            className="ant-form-antd-custom"
          >
            <Form.Item
              validateStatus={errors.date ? "error" : undefined}
              help={errors.date?.message}
            >
              <Controller
                name="date"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    value={field.value ?? undefined}
                    onChange={(v) => field.onChange(v ?? null)}
                    placeholder="เลือกวันที่"
                    className="w-full"
                    size="large"
                    format="DD/MM/YYYY"
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Member *"
              validateStatus={errors.member ? "error" : undefined}
              help={errors.member?.message}
            >
              <Controller
                name="member"
                control={control}
                rules={{ required: "Please select a member" }}
                render={({ field }) => (
                  <Select
                    {...field}
                    value={field.value || undefined}
                    onChange={(v) => field.onChange(v ?? "")}
                    options={memberOptions}
                    placeholder="-- Select a member --"
                    allowClear
                    className="w-full"
                    size="large"
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Type *"
              validateStatus={errors.type ? "error" : undefined}
              help={errors.type?.message}
            >
              <Controller
                name="type"
                control={control}
                rules={{ required: "Please select a type" }}
                render={({ field }) => (
                  <Select
                    {...field}
                    value={field.value || undefined}
                    onChange={(v) => {
                      field.onChange(v ?? "");
                      setValue("topicRule", "");
                      setValue("action", "");
                    }}
                    options={typeOptions}
                    placeholder="-- Select a type --"
                    allowClear
                    className="w-full"
                    size="large"
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Topic rules *"
              validateStatus={errors.topicRule ? "error" : undefined}
              help={errors.topicRule?.message}
            >
              <Controller
                name="topicRule"
                control={control}
                rules={{ required: "Please select a topic" }}
                render={({ field }) => (
                  <Select
                    {...field}
                    value={field.value || undefined}
                    onChange={(v) => {
                      field.onChange(v ?? "");
                      setValue("action", "");
                    }}
                    options={topicOptions}
                    placeholder="-- Select a topic --"
                    allowClear
                    className="w-full"
                    size="large"
                    disabled={!selectedType}
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Action *"
              validateStatus={errors.action ? "error" : undefined}
              help={errors.action?.message}
            >
              <Controller
                name="action"
                control={control}
                rules={{ required: "Please select an action" }}
                render={({ field }) => (
                  <Select
                    {...field}
                    value={field.value || undefined}
                    onChange={(v) => field.onChange(v ?? "")}
                    options={actionOptions}
                    placeholder="-- Select an action --"
                    allowClear
                    className="w-full"
                    size="large"
                    disabled={!selectedTopicId}
                  />
                )}
              />
            </Form.Item>

            <Form.Item
              label="Sprint *"
              validateStatus={errors.sprint ? "error" : undefined}
              help={errors.sprint?.message}
            >
              <Controller
                name="sprint"
                control={control}
                rules={{ required: "Please enter a sprint" }}
                render={({ field }) => (
                  <Input
                    {...field}
                    placeholder="e.g. 1, 2, 3, etc."
                    className="w-full"
                    size="large"
                  />
                )}
              />
            </Form.Item>

            <Form.Item label="Notes">
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <TextArea
                    {...field}
                    rows={3}
                    placeholder="Additional notes"
                    className="w-full"
                    size="large"
                  />
                )}
              />
            </Form.Item>

            <Form.Item className="mb-0 mt-4">
              <div className="flex gap-3 justify-end">
                <Button
                  type="default"
                  onClick={handleCancel}
                  className="h-[40px]! dark:hover:bg-zinc-800! w-[120px]!"
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  htmlType="submit"
                  className="bg-blue-600! hover:bg-blue-700! text-white! font-bold! py-2 px-4 rounded! h-[40px]! w-[120px]!"
                >
                  Save
                </Button>
              </div>
            </Form.Item>
          </Form>
        </form>
      )}
    </div>
  );
}
