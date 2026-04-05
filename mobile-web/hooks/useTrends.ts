"use client";
import { useAsync } from "./useAsync";
import { trendsService } from "@/services/trends.service";
export function useTrends(limit = 10) {
  const { data, isLoading, error } = useAsync(() => trendsService.getTrends(limit), [limit]);
  return { trends: data?.data ?? [], isLoading, error };
}
