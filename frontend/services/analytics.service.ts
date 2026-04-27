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

// Raw shapes returned by the backend
interface RawFunnelStage {
  stage: string;
  count: number;
  drop_off_pct: number;
}

interface RawBehaviorResponse {
  funnel: RawFunnelStage[];
}

interface RawCohortResponse {
  data: { cohort: string; size: number; retention: number[] }[];
}

export const analyticsService = {
  async getFunnelData(): Promise<FunnelData> {
    const raw = await apiClient.get<RawBehaviorResponse>("/analytics/behavior");
    const stages = raw.funnel ?? [];
    const first = stages[0]?.count ?? 0;
    const last = stages[stages.length - 1]?.count ?? 0;
    return {
      steps: stages.map((s, i) => ({
        step: s.stage.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        count: s.count,
        conversionRate: i === 0 ? 100 : Math.max(0, 100 - s.drop_off_pct),
      })),
      overallConversion: first > 0 ? (last / first) * 100 : 0,
    };
  },

  async getCohortData(): Promise<CohortData> {
    const raw = await apiClient.get<RawCohortResponse>("/analytics/cohorts");
    const rows = raw.data ?? [];
    return {
      weeks: rows.length > 0 ? rows[0].retention.map((_, i) => `Week ${i}`) : [],
      rows: rows.map((r) => ({ cohort: r.cohort, size: r.size, retention: r.retention })),
    };
  },

  async getHeatmapData(): Promise<HeatmapData> {
    const raw = await apiClient.get<{ cells: HeatmapCell[]; max_value: number }>("/analytics/heatmap");
    return { cells: raw.cells ?? [], maxValue: raw.max_value ?? 0 };
  },
};
