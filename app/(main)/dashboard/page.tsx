import dayjs from "dayjs";

export default function DashboardPage() {
  return (
    <main className="flex-1 p-6 sm:p-8">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 flex items-center justify-between gap-2">
        <span>Dashboard</span>
        <span>
          {dayjs().format("DD/MM/YYYY")}
        </span>
      </h1>
      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
          ยินดีต้อนรับสู่ Dashboard
        </h2>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          นี่คือหน้า Dashboard ของคุณ คุณสามารถเพิ่ม widgets, charts
          และเนื้อหาอื่นๆ ได้ตามต้องการ
        </p>
      </div>
    </main>
  );
}
