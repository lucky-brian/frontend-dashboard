import { ConventionForm } from "@/components/conversion-log/ConventionForm";
import { TeamRulesBox } from "@/components/conversion-log/TeamRulesBox";

export default function ConversionPage() {
  return (
    <main className="flex-1 p-6 sm:p-8 w-full">
      <div className="flex gap-6 justify-between">
        <TeamRulesBox />
        <ConventionForm />
      </div>
    </main>
  );
}
