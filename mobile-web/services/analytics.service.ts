import { apiClient } from "@/lib/api-client";

export interface FunnelStep {
  step: string;
  count: number;
  rate: number;
}

export interface CohortRow {
  cohort: string;
  size: number;
  retentionByWeek: number[];
}

export const analyticsService = {
  getFunnel: () =>
    apiClient.get<FunnelStep[]>("/analytics/funnel"),

  getCohort: () =>
    apiClient.get<CohortRow[]>("/analytics/cohort"),
};
