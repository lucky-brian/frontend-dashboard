export const NAV_ITEMS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Convention", href: "/convention" },
  { label: "KPI", href: "/kpi" },
] as const;

/** สมาชิกทีม (สำหรับ select) */
export const TEAM_MEMBERS = [
  "Phurin",
  "Supphawit",
  "Phitipong",
  "Montra",
] as const;

/** Type ของ redux point */
export const REDUX_TYPE_OPTIONS = [
  { value: "convention", label: "Convention" },
  { value: "delivery", label: "Delivery" },
] as const;

/** Topic rules (สำหรับ select) */
export const CONVENTION_TYPE_RULES = [
  { value: "Commit Message", label: "Commit Message", type: "convention" },
  { value: "Branch Naming", label: "Branch Naming", type: "convention" },
  { value: "Dev Testing", label: "Dev Testing", type: "convention" },
  { value: "Delivery", label: "Delivery", type: "delivery" },
] as const;

export const ACTION_RULES = [
  {
    value: "ระบุ type ของ commit ไม่ถูกต้อง",
    label: "ระบุ type ของ commit ไม่ถูกต้อง",
    type: "commit_message",
  },
  {
    value: "ไม่ระบุ type หรือ message ของ commit",
    label: "ไม่ระบุ type หรือ message ของ commit",
    type: "commit_message",
  },
  {
    value: "ตั้งชื่อ branch ไม่ตรงตาม standard",
    label: "ตั้งชื่อ branch ไม่ตรงตาม standard",
    type: "branch_naming",
  },
  {
    value:
      "เปิด Merge Request ที่มีเนื้อหาจาก Task อื่น (ถ้าเล็กน้อยอนุโรมตามดุลพินิจ)",
    label:
      "เปิด Merge Request ที่มีเนื้อหาจาก Task อื่น (ถ้าเล็กน้อยอนุโรมตามดุลพินิจ)",
    type: "branch_naming",
  },
  {
    value: "ส่ง parent การ์ดให้ review โดยที่ไม่ส่งหลักฐานประกอบการทดสอบ",
    label: "ส่ง parent การ์ดให้ review โดยที่ไม่ส่งหลักฐานประกอบการทดสอบ",
    type: "dev_testing",
  },
  {
    value: "ปิด Task ภายใน sprint ไม่ได้",
    label: "ปิด Task ภายใน sprint ไม่ได้",
    type: "delivery",
  },
  {
    value: "ปิด merge request ภายในวันไม่ได้",
    label: "ปิด merge request ภายในวันไม่ได้",
    type: "delivery",
  },
] as const;

export const ConventionRules = [
  {
    id: 1,
    title: "Commit Message",
    rules: [
      "ระบุ type ของ commit ไม่ถูกต้อง",
      "ไม่ระบุ type หรือ message ของ commit",
    ],
  },
  {
    id: 2,
    title: "Branch Naming",
    rules: [
      "ตั้งชื่อ branch ไม่ตรงตาม standard",
      "เปิด Merge Request ที่มีเนื้อหาจาก Task อื่น (ถ้าเล็กน้อยอนุโรมตามดุลพินิจ)",
    ],
  },
  {
    id: 3,
    title: "Dev Testing",
    rules: ["ส่ง parent การ์ดให้ review โดยที่ไม่ส่งหลักฐานประกอบการทดสอบ"],
  },
  {
    id: 4,
    title: "Delivery",
    rules: ["ปิด Task ภายใน sprint ไม่ได้", "ปิด merge request ภายในวันไม่ได้"],
  },
] as const;
