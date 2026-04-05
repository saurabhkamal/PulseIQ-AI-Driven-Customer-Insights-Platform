"use client";

import { useAsync } from "./useAsync";
import { analyticsService } from "@/services/analytics.service";

export function useFunnel() {
  const { data, isLoading, error } = useAsync(() => analyticsService.getFunnel());
  return { steps: data ?? [], isLoading, error };
}

export function useCohort() {
  const { data, isLoading, error } = useAsync(() => analyticsService.getCohort());
  return { rows: data ?? [], isLoading, error };
}
