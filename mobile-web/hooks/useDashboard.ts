"use client";
import { useAsync } from "./useAsync";
import { dashboardService } from "@/services/dashboard.service";
export function useDashboard() {
  const { data: metrics, isLoading, error } = useAsync(() => dashboardService.getKpiMetrics());
  return { metrics: metrics ?? [], isLoading, error };
}
