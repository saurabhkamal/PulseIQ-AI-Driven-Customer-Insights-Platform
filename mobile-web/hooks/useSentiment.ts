"use client";
import { useAsync } from "./useAsync";
import { sentimentService } from "@/services/sentiment.service";
export function useSentimentSummary() {
  return useAsync(() => sentimentService.getSummary());
}
export function useSentimentResults(limit = 10) {
  const { data, isLoading, error } = useAsync(() => sentimentService.getResults(limit), [limit]);
  return { results: data?.data ?? [], isLoading, error };
}
