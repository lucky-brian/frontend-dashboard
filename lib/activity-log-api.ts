import { createClient } from "@/lib/supabase";
import type { ActivityLog } from "@/lib/database.types";

export type InsertActivityLogParams = {
  actor_name: string;
  action_type: string;
  description: string;
  metadata?: Record<string, unknown> | null;
};

/** บันทึก activity (ใคร ทำอะไร) */
export async function insertActivityLog(
  params: InsertActivityLogParams
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("activity_log").insert({
    actor_name: params.actor_name,
    action_type: params.action_type,
    description: params.description,
    metadata: params.metadata ?? null,
  });
  if (error) throw error;
}

export type SettingConventionSub = "add" | "edit" | "delete";

export type GetActivityLogsParams = {
  fromDate?: string;
  toDate?: string;
  actionType?: string;
  /** เมื่อ actionType เป็น setting_convention สามารถกรองย่อย: เพิ่ม / แก้ไข / ลบ */
  settingConventionSub?: SettingConventionSub;
  actorName?: string;
  limit?: number;
};

const SETTING_SUB_PATTERNS: Record<
  NonNullable<GetActivityLogsParams["settingConventionSub"]>,
  string
> = {
  add: "เพิ่ม",
  edit: "แก้ไข",
  delete: "ลบ",
};

/** ดึง activity logs ตาม filter (default 20 รายการล่าสุด) */
export async function getActivityLogs(
  params: GetActivityLogsParams = {}
): Promise<ActivityLog[]> {
  const {
    fromDate,
    toDate,
    actionType,
    settingConventionSub,
    actorName,
    limit = 20,
  } = params;
  const supabase = createClient();
  let q = supabase
    .from("activity_log")
    .select("id, actor_name, action_type, description, metadata, created_at")
    .order("created_at", { ascending: false });

  if (fromDate) q = q.gte("created_at", `${fromDate}T00:00:00.000Z`);
  if (toDate) q = q.lte("created_at", `${toDate}T23:59:59.999Z`);
  if (actionType) q = q.eq("action_type", actionType);
  if (
    actionType === "setting_convention" &&
    settingConventionSub &&
    SETTING_SUB_PATTERNS[settingConventionSub]
  ) {
    q = q.ilike("description", `%${SETTING_SUB_PATTERNS[settingConventionSub]}%`);
  }
  if (actorName) q = q.eq("actor_name", actorName);
  q = q.limit(limit);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ActivityLog[];
}
