"use client";

import {
  getConventionRules,
  getTopicConventionOptions,
} from "@/lib/convention-api";
import type { ConventionRule } from "@/lib/database.types";
import type { TopicConventionOptionWithType } from "@/lib/convention-api";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

type GroupedRule = {
  topicId: string;
  title: string;
  sortOrder: number;
  rules: { id: string; rule_text: string; sort_order: number }[];
};

export function TeamRulesBox() {
  const [groups, setGroups] = useState<GroupedRule[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rules, topics] = await Promise.all([
        getConventionRules(),
        getTopicConventionOptions(),
      ]);
      const topicMap = new Map<string, TopicConventionOptionWithType>(
        topics.map((t) => [t.id, t])
      );
      const byTopic = new Map<
        string,
        { title: string; sortOrder: number; rules: ConventionRule[] }
      >();
      for (const r of rules) {
        const topic = topicMap.get(r.topic_id);
        if (!topic) continue;
        let g = byTopic.get(r.topic_id);
        if (!g) {
          g = { title: topic.title, sortOrder: topic.sort_order, rules: [] };
          byTopic.set(r.topic_id, g);
        }
        g.rules.push(r);
      }
      const sorted = Array.from(byTopic.entries())
        .map(([topicId, g]) => {
          const rulesSorted = [...g.rules].sort(
            (a, b) => a.sort_order - b.sort_order
          );
          return {
            topicId,
            title: g.title,
            sortOrder: g.sortOrder,
            rules: rulesSorted,
          };
        })
        .sort((a, b) => a.sortOrder - b.sortOrder);
      setGroups(sorted);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 w-1/2">
      <h2 className="mb-4 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        Convention Rules
      </h2>

      {loading ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          กำลังโหลด...
        </p>
      ) : groups.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          ยังไม่มีกฎ — เพิ่มได้ที่ Setting Convention
        </p>
      ) : (
        groups.map((group) => (
          <div key={group.topicId} className="mb-4">
            <p className="mb-2 text-md font-semibold text-zinc-900 dark:text-zinc-50">
              {group.title}
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
              {group.rules.map((r) => (
                <li key={r.id}>{r.rule_text}</li>
              ))}
            </ul>
          </div>
        ))
      )}

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
