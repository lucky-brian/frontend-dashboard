import { ConventionLog } from "@/components/dashboard/ConventionLog";
import { ConventionSummary } from "@/components/dashboard/ConventionSummary";

export default function DashboardPage() {
  return (
    <main className="flex-1 p-6 sm:p-8">
      <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        <span>ยินดีต้อนรับสู่ Dashboard</span>
      </h1>
      <div className="mt-6">
        <ConventionSummary />
      </div>
      <div className="mt-6">
        <ConventionLog />
      </div>
    </main>
  );
}
