import Image from "next/image";
import { ConventionRules } from "@/lib/constants";

export function TeamRulesBox() {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 w-1/2">
      <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Convention Rules
      </h2>

      {ConventionRules.map((rule) => (
        <div key={rule.title} className="mb-4">
          <p className="mb-2 text-md font-semibold text-zinc-900 dark:text-zinc-50">
            {rule.title}
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
            {rule.rules.map((r, i: number) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </div>
      ))}
      <div className="flex gap-3 justify-start pt-10">
        <Image
          src="https://i.pinimg.com/736x/70/e4/8a/70e48a69d373af42c0bbf9f6844792b1.jpg"
          alt="team rules"
          width={200}
          height={200}
          className="w-[200px] object-cover"
        />
      </div>
    </div>
  );
}
