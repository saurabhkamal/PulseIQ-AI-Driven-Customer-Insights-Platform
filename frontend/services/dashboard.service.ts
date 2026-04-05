import { apiClient } from "@/lib/api-client";
import type { KpiMetric } from "@/types";

export const dashboardService = {
  getKpiMetrics(): Promise<KpiMetric[]> {
    return apiClient.get<KpiMetric[]>("/dashboards/kpi");
  },
};
