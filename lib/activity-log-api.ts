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

export type GetActivityLogsParams = {
  fromDate?: string;
  toDate?: string;
  actionType?: string;
  limit?: number;
};

/** ดึง activity logs ตาม filter (default 20 รายการล่าสุด) */
export async function getActivityLogs(
  params: GetActivityLogsParams = {}
): Promise<ActivityLog[]> {
  const { fromDate, toDate, actionType, limit = 20 } = params;
  const supabase = createClient();
  let q = supabase
    .from("activity_log")
    .select("id, actor_name, action_type, description, metadata, created_at")
    .order("created_at", { ascending: false });

  if (fromDate) q = q.gte("created_at", `${fromDate}T00:00:00.000Z`);
  if (toDate) q = q.lte("created_at", `${toDate}T23:59:59.999Z`);
  if (actionType) q = q.eq("action_type", actionType);
  q = q.limit(limit);

  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as ActivityLog[];
}
