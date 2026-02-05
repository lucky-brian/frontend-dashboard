import { createClient } from "@/lib/supabase";
import type {
  ActionRule,
  ConventionRule,
  ConventionType,
  FrontendMember,
  MemberConventionSummary,
  TopicConventionOption,
} from "@/lib/database.types";

/** ดึงสมาชิกทีม (เฉพาะที่ is_active) */
export async function getFrontendMembers(): Promise<FrontendMember[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("frontend_member")
    .select("id, name, email, is_active, created_at, updated_at")
    .eq("is_active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

/** ผลลัพธ์สรุปรายคน (ดึงจาก member_convention_summary ไม่ query convention_logs) */
export type MemberConventionSummaryItem = {
  member_id: string;
  name: string;
  violation_count: number;
};

/** ดึงสรุปจำนวนครั้งที่ผิดกฎต่อสมาชิก (จากตาราง member_convention_summary) */
export async function getMemberConventionSummaries(): Promise<
  MemberConventionSummaryItem[]
> {
  const supabase = createClient();
  const [membersResult, summaryResult] = await Promise.all([
    supabase
      .from("frontend_member")
      .select("id, name")
      .eq("is_active", true)
      .order("name"),
    supabase.from("member_convention_summary").select("member_id, violation_count"),
  ]);
  if (membersResult.error) throw membersResult.error;
  if (summaryResult.error) throw summaryResult.error;

  const members = membersResult.data ?? [];
  const summaryRows = (summaryResult.data ?? []) as MemberConventionSummary[];
  const countByMember = new Map(summaryRows.map((s) => [s.member_id, s.violation_count]));

  return members.map((m) => ({
    member_id: m.id,
    name: m.name,
    violation_count: countByMember.get(m.id) ?? 0,
  }));
}

/** ตัวเลือกประเภท Topic ใช้ในฟอร์ม Setting (ดึงจากตาราง convention_type) */
export type ConventionTypeOption = { value: string; label: string };

export async function getConventionTypeOptions(): Promise<
  ConventionTypeOption[]
> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("convention_type")
    .select("value, label")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map((r) => ({ value: r.value, label: r.label }));
}

/** ดึงประเภท convention ทั้งหมด (เรียงตาม sort_order) */
export async function getConventionTypes(): Promise<ConventionType[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("convention_type")
    .select("id, value, label, sort_order, created_at, updated_at")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []) as ConventionType[];
}

/** เพิ่ม convention type */
export async function insertConventionType(params: {
  value: string;
  label: string;
  sort_order?: number;
}): Promise<ConventionType> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("convention_type")
    .insert({
      value: params.value,
      label: params.label,
      sort_order: params.sort_order ?? 0,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ConventionType;
}

/** แก้ไข convention type */
export async function updateConventionType(
  id: string,
  params: { value?: string; label?: string; sort_order?: number }
): Promise<ConventionType> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("convention_type")
    .update(
      Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined)
      )
    )
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as ConventionType;
}

/** ลบ convention type */
export async function deleteConventionType(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("convention_type")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

/** Topic พร้อม type (value) สำหรับ backward compatibility กับ form */
export type TopicConventionOptionWithType = TopicConventionOption & {
  type: string;
};

/** ดึงหัวข้อ convention ทั้งหมด (เรียงตาม sort_order) พร้อม type จาก convention_type */
export async function getTopicConventionOptions(): Promise<
  TopicConventionOptionWithType[]
> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("topic_convention_option")
    .select("id, title, type_id, sort_order, created_at, updated_at, convention_type(value, label)")
    .order("sort_order");
  if (error) throw error;
  const rows = (data ?? []) as (TopicConventionOption & {
    convention_type: { value: string; label: string } | { value: string; label: string }[];
  })[];
  return rows.map((row) => {
    const { convention_type: ct, ...rest } = row;
    const typeValue = Array.isArray(ct) ? ct[0]?.value : ct?.value;
    return { ...rest, type: typeValue ?? "" };
  }) as TopicConventionOptionWithType[];
}

/** ดึง action rules ทั้งหมด (เรียงตาม topic แล้ว sort_order) */
export async function getActionRules(): Promise<ActionRule[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("action_rules")
    .select("id, topic_id, label, value, sort_order, created_at, updated_at")
    .order("topic_id")
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

/** ดึง convention rules ทั้งหมด (เรียงตาม topic แล้ว sort_order) */
export async function getConventionRules(): Promise<ConventionRule[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("convention_rules")
    .select("id, topic_id, rule_text, sort_order, created_at, updated_at")
    .order("topic_id")
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

/** เพิ่ม topic convention */
export async function insertTopicConventionOption(params: {
  title: string;
  type_id: string;
  sort_order?: number;
}): Promise<TopicConventionOption> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("topic_convention_option")
    .insert({
      title: params.title,
      type_id: params.type_id,
      sort_order: params.sort_order ?? 0,
    })
    .select()
    .single();
  if (error) throw error;
  return data as TopicConventionOption;
}

/** แก้ไข topic convention */
export async function updateTopicConventionOption(
  id: string,
  params: { title?: string; type_id?: string; sort_order?: number }
): Promise<TopicConventionOption> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("topic_convention_option")
    .update(
      Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined)
      )
    )
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as TopicConventionOption;
}

/** ลบ topic convention */
export async function deleteTopicConventionOption(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("topic_convention_option")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

/** เพิ่ม convention rule */
export async function insertConventionRule(params: {
  topic_id: string;
  rule_text: string;
  sort_order?: number;
}): Promise<ConventionRule> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("convention_rules")
    .insert({
      topic_id: params.topic_id,
      rule_text: params.rule_text,
      sort_order: params.sort_order ?? 0,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ConventionRule;
}

/** แก้ไข convention rule */
export async function updateConventionRule(
  id: string,
  params: { topic_id?: string; rule_text?: string; sort_order?: number }
): Promise<ConventionRule> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("convention_rules")
    .update(
      Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined)
      )
    )
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as ConventionRule;
}

/** ลบ convention rule */
export async function deleteConventionRule(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("convention_rules").delete().eq("id", id);
  if (error) throw error;
}

/** เพิ่ม action rule */
export async function insertActionRule(params: {
  topic_id: string;
  label: string;
  value: string;
  sort_order?: number;
}): Promise<ActionRule> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("action_rules")
    .insert({
      topic_id: params.topic_id,
      label: params.label,
      value: params.value,
      sort_order: params.sort_order ?? 0,
    })
    .select()
    .single();
  if (error) throw error;
  return data as ActionRule;
}

/** แก้ไข action rule */
export async function updateActionRule(
  id: string,
  params: {
    topic_id?: string;
    label?: string;
    value?: string;
    sort_order?: number;
  }
): Promise<ActionRule> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("action_rules")
    .update(
      Object.fromEntries(
        Object.entries(params).filter(([, v]) => v !== undefined)
      )
    )
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data as ActionRule;
}

/** ลบ action rule */
export async function deleteActionRule(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("action_rules").delete().eq("id", id);
  if (error) throw error;
}

export type InsertConventionLogParams = {
  log_date: string;
  member_id: string;
  type: string;
  topic_id: string;
  action_rule_id: string;
  sprint?: string | null;
  notes?: string | null;
  created_by?: string | null;
};

/** บันทึก convention log */
export async function insertConventionLog(
  params: InsertConventionLogParams
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("convention_logs").insert({
    log_date: params.log_date,
    member_id: params.member_id,
    type: params.type,
    topic_id: params.topic_id,
    action_rule_id: params.action_rule_id,
    sprint: params.sprint ?? null,
    notes: params.notes ?? null,
    created_by: params.created_by ?? null,
  });
  if (error) throw error;
}

/** แก้ไข convention log */
export async function updateConventionLog(
  id: string,
  params: InsertConventionLogParams
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("convention_logs")
    .update({
      log_date: params.log_date,
      member_id: params.member_id,
      type: params.type,
      topic_id: params.topic_id,
      action_rule_id: params.action_rule_id,
      sprint: params.sprint ?? null,
      notes: params.notes ?? null,
    })
    .eq("id", id);
  if (error) throw error;
}

/** ลบ convention log */
export async function deleteConventionLog(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("convention_logs").delete().eq("id", id);
  if (error) throw error;
}

/** ประเภทสำหรับ log ที่ join กับ member, topic, action */
export type ConventionLogWithDetails = {
  id: string;
  log_date: string;
  member_id: string;
  type: string;
  topic_id: string;
  action_rule_id: string;
  sprint: string | null;
  notes: string | null;
  created_at: string;
  frontend_member: { name: string } | null;
  topic_convention_option: { title: string } | null;
  action_rules: { label: string } | null;
};

/** ดึง convention logs ล่าสุด (จำกัด 10 รายการ) พร้อมชื่อ member, topic, action */
export async function getLatestConventionLogs(): Promise<
  ConventionLogWithDetails[]
> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("convention_logs")
    .select(conventionLogsSelect)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  return normalizeLogRows(data ?? []);
}

const conventionLogsSelect = `
  id,
  log_date,
  member_id,
  type,
  topic_id,
  action_rule_id,
  sprint,
  notes,
  created_at,
  frontend_member(name),
  topic_convention_option(title),
  action_rules(label)
`;

function normalizeLogRows(data: Record<string, unknown>[]): ConventionLogWithDetails[] {
  return data.map((row: Record<string, unknown>) => {
    const fm = row.frontend_member;
    const tco = row.topic_convention_option;
    const ar = row.action_rules;
    return {
      ...row,
      frontend_member: Array.isArray(fm) ? fm[0] ?? null : (fm as ConventionLogWithDetails["frontend_member"]),
      topic_convention_option: Array.isArray(tco) ? tco[0] ?? null : (tco as ConventionLogWithDetails["topic_convention_option"]),
      action_rules: Array.isArray(ar) ? ar[0] ?? null : (ar as ConventionLogWithDetails["action_rules"]),
    };
  }) as ConventionLogWithDetails[];
}

/** ดึง convention logs ตามช่วงวันที่ (พร้อมชื่อ member, topic, action) */
export async function getConventionLogsByDateRange(
  startDate: string,
  endDate: string
): Promise<ConventionLogWithDetails[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("convention_logs")
    .select(conventionLogsSelect)
    .gte("log_date", startDate)
    .lte("log_date", endDate)
    .order("log_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return normalizeLogRows(data ?? []);
}
