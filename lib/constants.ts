export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Convention", href: "/convention" },
  { label: "KPI", href: "/kpi" },
  { label: "Setting Convention", href: "/convention-settings" },
  { label: "Activity Log", href: "/activity-log" },
] as const;

export const FRONTEND_MEMBERS = [
  { name: "Phurin", role: "senior" },
  { name: "Pitiphong", role: "junior" },
  { name: "Montra", role: "junior" },
  { name: "Supphawit", role: "senior" },
] as const;

export const LOCAL_STORAGE_KEYS = {
  CURRENT_USER: "frontend-dashboard-current-user",
} as const;

/** ประเภทการกระทำใน Activity Log (สำหรับ filter และ export) */
export const ACTIVITY_ACTION_TYPES = [
  { value: "add_convention_log", label: "เพิ่ม Convention Log" },
  { value: "edit_convention_log", label: "แก้ไข Convention Log" },
  { value: "delete_convention_log", label: "ลบ Convention Log" },
  { value: "setting_convention", label: "Setting Convention" },
] as const;

export type ActivityActionType = (typeof ACTIVITY_ACTION_TYPES)[number]["value"];
