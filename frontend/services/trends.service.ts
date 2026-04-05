import { apiClient } from "@/lib/api-client";
import type { TrendPrediction, PaginatedResponse } from "@/types";

interface GetTrendsParams {
  page?: number;
  pageSize?: number;
  limit?: number;
}

export const trendsService = {
  getTrends(params: GetTrendsParams = {}): Promise<PaginatedResponse<TrendPrediction>> {
    return apiClient.get<PaginatedResponse<TrendPrediction>>("/analytics/trends", {
      params: {
        page: params.page ?? 1,
        page_size: params.limit ?? params.pageSize ?? 20,
      },
    });
  },
};
