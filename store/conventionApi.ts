import {
  getActionRules,
  getFrontendMembers,
  getLatestConventionLogs,
  getMemberConventionSummaries,
  getTopicConventionOptions,
} from "@/lib/convention-api";
import type {
  ConventionLogWithDetails,
  MemberConventionSummaryItem,
} from "@/lib/convention-api";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export type SelectOption = { value: string; label: string };

export type ConventionFormOptionsResult = {
  memberOptions: SelectOption[];
  typeOptions: SelectOption[];
  topics: { id: string; title: string; type: "convention" | "delivery" }[];
  actionRules: { id: string; topic_id: string; label: string }[];
};

const TYPE_LABELS: Record<string, string> = {
  convention: "Convention",
  delivery: "Delivery",
};

export const conventionApi = createApi({
  reducerPath: "conventionApi",
  baseQuery: fetchBaseQuery({ baseUrl: "" }),
  keepUnusedDataFor: 60 * 60, // cache 1 ชม.
  endpoints: (builder) => ({
    getConventionFormOptions: builder.query<
      ConventionFormOptionsResult,
      void
    >({
      queryFn: async () => {
        try {
          const [members, topics, actionRules] = await Promise.all([
            getFrontendMembers(),
            getTopicConventionOptions(),
            getActionRules(),
          ]);

          const typeSet = new Set(topics.map((t) => t.type));
          const typeOptions: SelectOption[] = Array.from(typeSet).map(
            (type) => ({
              value: type,
              label: TYPE_LABELS[type] ?? type,
            })
          );

          const data: ConventionFormOptionsResult = {
            memberOptions: members.map((m) => ({
              value: m.id,
              label: m.name,
            })),
            typeOptions,
            topics: topics.map((t) => ({
              id: t.id,
              title: t.title,
              type: t.type,
            })),
            actionRules: actionRules.map((a) => ({
              id: a.id,
              topic_id: a.topic_id,
              label: a.label,
            })),
          };
          return { data };
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to load options";
          return {
            error: { status: "FETCH_ERROR" as const, error: message },
          };
        }
      },
    }),
    getLatestConventionLogs: builder.query<ConventionLogWithDetails[], void>({
      queryFn: async () => {
        try {
          const data = await getLatestConventionLogs();
          return { data };
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to load logs";
          return {
            error: { status: "FETCH_ERROR" as const, error: message },
          };
        }
      },
    }),
    getMemberConventionSummaries: builder.query<
      MemberConventionSummaryItem[],
      void
    >({
      queryFn: async () => {
        try {
          const data = await getMemberConventionSummaries();
          return { data };
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to load summary";
          return {
            error: { status: "FETCH_ERROR" as const, error: message },
          };
        }
      },
    }),
  }),
});

export const {
  useGetConventionFormOptionsQuery,
  useGetLatestConventionLogsQuery,
  useGetMemberConventionSummariesQuery,
} = conventionApi;
