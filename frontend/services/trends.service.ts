import { apiClient } from "@/lib/api-client";
import type { TrendPrediction, PaginatedResponse } from "@/types";

// ─── Trends Insights types ────────────────────────────────────────────────────

export interface SignalBreakdownItem {
  signal_strength: "high" | "medium" | "low";
  count: number;
}

export interface CategoryCountItem {
  category: string;
  count: number;
}

export interface ScatterPoint {
  id: string;
  title: string;
  horizon_days: number;
  confidence: number;
  signal_strength: "high" | "medium" | "low";
  category: string;
}

export interface VolumeWeek {
  week: string;
  count: number;
}

export interface CategoryConfidenceItem {
  category: string;
  avg_confidence: number;
  count: number;
}

export interface TrendSummaryItem {
  id: string;
  title: string;
  horizon_days: number | null;
  confidence: number;
  signal_strength: "high" | "medium" | "low";
  category: string;
}

export interface TrendsInsights {
  signal_breakdown: SignalBreakdownItem[];
  by_category: CategoryCountItem[];
  scatter_points: ScatterPoint[];
  volume_by_week: VolumeWeek[];
  category_confidence: CategoryConfidenceItem[];
  emerging: TrendSummaryItem[];
  maturing: TrendSummaryItem[];
  monitoring: TrendSummaryItem[];
  total: number;
}

interface GetTrendsParams {
  page?: number;
  pageSize?: number;
  limit?: number;
}

interface RawTrendItem {
  id: string;
  title: string;
  description: string;
  confidence: number;
  category: string | null;
  signal_strength: string;
  horizon_days: number | null;
  generated_at: string;
}

interface RawPaginatedTrends {
  data: RawTrendItem[];
  meta: { page: number; page_size: number; total: number; total_pages: number };
}

function toTrendPrediction(r: RawTrendItem): TrendPrediction {
  return {
    id: r.id,
    trendName: r.title,
    description: r.description,
    signalStrength: r.signal_strength as TrendPrediction["signalStrength"],
    confidence: r.confidence ?? 0,
    forecastPeriod: r.horizon_days ? `${r.horizon_days} days` : "Short term",
    createdAt: r.generated_at,
  };
}

export const trendsService = {
  async getTrendsInsights(): Promise<TrendsInsights> {
    return apiClient.get<TrendsInsights>("/analytics/trends/insights");
  },

  async getTrends(params: GetTrendsParams = {}): Promise<PaginatedResponse<TrendPrediction>> {
    const raw = await apiClient.get<RawPaginatedTrends>("/analytics/trends", {
      params: {
        page: params.page ?? 1,
        page_size: params.limit ?? params.pageSize ?? 20,
      },
    });
    return {
      data: raw.data.map(toTrendPrediction),
      meta: {
        page: raw.meta.page,
        pageSize: raw.meta.page_size,
        total: raw.meta.total,
        totalPages: raw.meta.total_pages,
      },
    };
  },
};
