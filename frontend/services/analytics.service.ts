import { apiClient } from "@/lib/api-client";

export interface FunnelStep {
  step: string;
  count: number;
  conversionRate: number;
}

export interface CohortRow {
  cohort: string;
  size: number;
  retention: number[];
}

export interface HeatmapCell {
  hour: number;
  day: number;
  value: number;
}

export interface FunnelData {
  steps: FunnelStep[];
  overallConversion: number;
}

export interface CohortData {
  weeks: string[];
  rows: CohortRow[];
}

export interface HeatmapData {
  cells: HeatmapCell[];
  maxValue: number;
}

export const analyticsService = {
  getFunnelData(): Promise<FunnelData> {
    return apiClient.get<FunnelData>("/analytics/behavior/funnel");
  },

  getCohortData(): Promise<CohortData> {
    return apiClient.get<CohortData>("/analytics/behavior/cohorts");
  },

  getHeatmapData(): Promise<HeatmapData> {
    return apiClient.get<HeatmapData>("/analytics/behavior/heatmap");
  },
};
