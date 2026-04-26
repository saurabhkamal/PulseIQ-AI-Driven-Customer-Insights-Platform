import { apiClient } from "@/lib/api-client";
import type { TrendPrediction, PaginatedResponse } from "@/types";

interface GetTrendsParams {
  page?: number;
  pageSize?: number;
  limit?: number;
}

interface RawTrend {
  id: string;
  title: string;
  description: string;
  confidence: number | null;
  category: string | null;
  signal_strength: TrendPrediction["signalStrength"];
  horizon_days: number | null;
  generated_at: string;
}

interface RawMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

function toTrend(r: RawTrend): TrendPrediction {
  return {
    id: r.id,
    trendName: r.title,
    description: r.description,
    signalStrength: r.signal_strength,
    confidence: r.confidence ?? 0,
    forecastPeriod: r.horizon_days ? `${r.horizon_days} days` : "30 days",
    createdAt: r.generated_at,
  };
}

export const trendsService = {
  async getTrends(params: GetTrendsParams = {}): Promise<PaginatedResponse<TrendPrediction>> {
    const raw = await apiClient.get<{ data: RawTrend[]; meta: RawMeta }>("/analytics/trends", {
      params: {
        page: params.page ?? 1,
        page_size: params.limit ?? params.pageSize ?? 20,
      },
    });
    return {
      data: raw.data.map(toTrend),
      meta: {
        page: raw.meta.page,
        pageSize: raw.meta.page_size,
        total: raw.meta.total,
        totalPages: raw.meta.total_pages,
      },
    };
  },
};
