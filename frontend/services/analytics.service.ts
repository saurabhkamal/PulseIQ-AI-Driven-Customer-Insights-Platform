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

export interface TopProduct {
  id: string;
  name: string;
  revenue: number;
  units: number;
}

export interface DauDay {
  date: string;
  count: number;
}

export interface NewVsReturningDay {
  date: string;
  new_customers: number;
  returning_customers: number;
}

export interface SegmentEngagement {
  segment: string;
  event_count: number;
  customer_count: number;
  engagement_score: number;
}

export interface ProductRevenueDay {
  date: string;
  revenue: number;
}

export interface ProductRevenueSeries {
  id: string;
  name: string;
  days: ProductRevenueDay[];
}

interface RawFunnelStage {
  stage: string;
  count: number;
  drop_off_pct: number;
}

export const analyticsService = {
  async getFunnelData(): Promise<FunnelData | null> {
    const raw = await apiClient.get<{ funnel: RawFunnelStage[] }>("/analytics/behavior");
    const funnel = raw.funnel ?? [];
    if (funnel.length === 0) return null;

    const steps: FunnelStep[] = funnel.map((stage, i) => ({
      step: stage.stage
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase()),
      count: stage.count,
      conversionRate:
        i === 0
          ? 100
          : Math.round((stage.count / Math.max(funnel[i - 1].count, 1)) * 1000) / 10,
    }));

    const firstCount = funnel[0].count;
    const lastCount = funnel[funnel.length - 1].count;
    const overallConversion =
      firstCount > 0 ? Math.round((lastCount / firstCount) * 1000) / 10 : 0;

    return { steps, overallConversion };
  },

  async getTopProducts(): Promise<TopProduct[] | null> {
    const raw = await apiClient.get<{ top_products: TopProduct[] }>("/analytics/behavior");
    const products = raw.top_products ?? [];
    return products.length > 0 ? products : null;
  },

  async getCohortData(): Promise<CohortData | null> {
    const raw = await apiClient.get<{
      cohort_by: string;
      metric: string;
      data: { cohort: string; size: number; weeks: number[] }[];
    }>("/analytics/cohorts");
    if (!raw.data || raw.data.length === 0) return null;
    const maxWeeks = Math.max(...raw.data.map((r) => r.weeks.length));
    const weeks = Array.from({ length: maxWeeks }, (_, i) => `W${i}`);
    return {
      weeks,
      rows: raw.data.map((r) => ({
        cohort: r.cohort,
        size: r.size,
        retention: r.weeks,
      })),
    };
  },

  async getHeatmapData(): Promise<HeatmapData | null> {
    const raw = await apiClient.get<{
      cells: { day: number; hour: number; value: number }[];
      max_value: number;
    }>("/analytics/heatmap");
    if (!raw.cells || raw.cells.length === 0) return null;
    return { cells: raw.cells, maxValue: raw.max_value };
  },

  async getDauTrend(): Promise<DauDay[] | null> {
    const raw = await apiClient.get<{ days: DauDay[] }>("/analytics/dau-trend");
    return raw.days?.length > 0 ? raw.days : null;
  },

  async getNewVsReturning(): Promise<NewVsReturningDay[] | null> {
    const raw = await apiClient.get<{ days: NewVsReturningDay[] }>("/analytics/new-vs-returning");
    return raw.days?.length > 0 ? raw.days : null;
  },

  async getSegmentEngagement(): Promise<SegmentEngagement[] | null> {
    const raw = await apiClient.get<{ segments: SegmentEngagement[] }>("/analytics/segment-engagement");
    return raw.segments?.length > 0 ? raw.segments : null;
  },

  async getProductRevenueTrend(): Promise<ProductRevenueSeries[] | null> {
    const raw = await apiClient.get<{ products: ProductRevenueSeries[] }>("/analytics/product-revenue-trend");
    return raw.products?.length > 0 ? raw.products : null;
  },
};
