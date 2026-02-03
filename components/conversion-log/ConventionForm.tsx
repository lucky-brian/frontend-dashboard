"use client";

import {
  ACTION_RULES,
  CONVENTION_TYPE_RULES,
  REDUX_TYPE_OPTIONS,
  TEAM_MEMBERS,
} from "@/lib/constants";
import { Button, DatePicker, Form, Input, Select } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { Controller, useForm } from "react-hook-form";
import { toast } from "react-hot-toast";

const { TextArea } = Input;

type ReduxPointFormValues = {
  date: Dayjs | null;
  member: string;
  type: string;
  topicRule: string;
  sprint: string;
  action: string;
  notes: string;
};

function getDefaultValues(): ReduxPointFormValues {
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

const memberOptions = TEAM_MEMBERS.map((name) => ({
  value: name,
  label: name,
}));

const typeOptions = REDUX_TYPE_OPTIONS.map((opt) => ({
  value: opt.value,
  label: opt.label,
}));

function getTopicOptionsByType(type: string) {
  if (!type) return [];
  const filtered = CONVENTION_TYPE_RULES.filter((t) => t.type === type);
  return filtered.map((t) => ({ value: t.value, label: t.label }));
}

const TOPIC_TO_ACTION_TYPE: Record<string, string> = {
  "Commit Message": "commit_message",
  "Branch Naming": "branch_naming",
  "Dev Testing": "dev_testing",
  Delivery: "delivery",
};

function getActionOptionsByTopic(topicRule: string) {
  if (!topicRule) return [];
  const actionType = TOPIC_TO_ACTION_TYPE[topicRule];
  if (!actionType) return [];
  const filtered = ACTION_RULES.filter((r) => r.type === actionType);
  return filtered.map((r) => ({ value: r.value, label: r.label }));
}

export function ConventionForm() {
  const {
    control,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReduxPointFormValues>({
    defaultValues: getDefaultValues(),
    mode: "onChange",
  });

  const selectedType = watch("type");
  const selectedTopicRule = watch("topicRule");
  const topicOptions = getTopicOptionsByType(selectedType ?? "");
  const actionOptions = getActionOptionsByTopic(selectedTopicRule ?? "");

  const onSave = (data: ReduxPointFormValues) => {
    const payload = {
      ...data,
      date: data.date ?? dayjs(),
    };
    toast.success("บันทึกสำเร็จ");
    console.info("ReduxPointForm submit", payload);
    reset(getDefaultValues());
  };

  const onCancel = () => {
    reset(getDefaultValues());
  };

  return (
    <div className="w-1/2 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
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
                  disabled={!selectedTopicRule}
                />
              )}
            />
          </Form.Item>

          <Form.Item label="Sprint">
            <Controller
              name="sprint"
              control={control}
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
                onClick={onCancel}
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
    </div>
  );
}
