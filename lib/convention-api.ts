import { createClient } from "@/lib/supabase";
import type {
  ActionRule,
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

/** ดึงหัวข้อ convention ทั้งหมด (เรียงตาม sort_order) */
export async function getTopicConventionOptions(): Promise<
  TopicConventionOption[]
> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("topic_convention_option")
    .select("*")
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

/** ดึง action rules ทั้งหมด (เรียงตาม topic แล้ว sort_order) */
export async function getActionRules(): Promise<ActionRule[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("action_rules")
    .select("*")
    .order("topic_id")
    .order("sort_order");
  if (error) throw error;
  return data ?? [];
}

export type InsertConventionLogParams = {
  log_date: string;
  member_id: string;
  type: "convention" | "delivery";
  topic_id: string;
  action_rule_id: string;
  sprint?: string | null;
  notes?: string | null;
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
  type: "convention" | "delivery";
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
    .select(
      `
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
    `
    )
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw error;

  const rows = data ?? [];
  return rows.map((row: Record<string, unknown>) => {
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
