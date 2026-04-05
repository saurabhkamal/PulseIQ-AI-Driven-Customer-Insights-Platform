"use client";
import { useAsync } from "./useAsync";
import { insightsService } from "@/services/insights.service";
export function useInsights(limit = 10) {
  const { data, isLoading, error } = useAsync(() => insightsService.getInsights(limit), [limit]);
  return { insights: data?.data ?? [], isLoading, error };
}
