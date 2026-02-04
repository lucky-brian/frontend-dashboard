"use client";

import { useGetConventionFormOptionsQuery } from "@/store/conventionApi";
import type { SelectOption } from "@/store/conventionApi";
import { useCallback } from "react";

export type { SelectOption } from "@/store/conventionApi";

export function useConventionFormOptions() {
  const { data, isLoading, error, isError } =
    useGetConventionFormOptionsQuery(undefined, {
      // refetch ตอน mount — ถ้า cache ถูก invalidate จาก convention settings จะได้ข้อมูลใหม่
      refetchOnMountOrArgChange: true,
      refetchOnFocus: false,
      refetchOnReconnect: false,
    });

  const getTopicOptions = useCallback(
    (type: string): SelectOption[] => {
      if (!data || !type) return [];
      return data.topics
        .filter((t) => t.type === type)
        .map((t) => ({ value: t.id, label: t.title }));
    },
    [data]
  );

  const getActionOptions = useCallback(
    (topicId: string): SelectOption[] => {
      if (!data || !topicId) return [];
      return data.actionRules
        .filter((a) => a.topic_id === topicId)
        .map((a) => ({ value: a.id, label: a.label }));
    },
    [data]
  );

  const errorMessage =
    isError && error
      ? typeof error === "string"
        ? error
        : "error" in error && typeof (error as { error?: string }).error === "string"
          ? (error as { error: string }).error
          : "message" in error
            ? String((error as { message?: string }).message)
            : "Failed to load options"
      : null;

  return {
    memberOptions: data?.memberOptions ?? [],
    typeOptions: data?.typeOptions ?? [],
    getTopicOptions,
    getActionOptions,
    isLoading,
    error: errorMessage,
  };
}
