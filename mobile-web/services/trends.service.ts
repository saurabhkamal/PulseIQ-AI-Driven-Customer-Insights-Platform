import { apiClient } from "@/lib/api-client";
import type { TrendPrediction, PaginatedResponse } from "@/types";
export const trendsService = {
  getTrends: (limit = 10) =>
    apiClient.get<PaginatedResponse<TrendPrediction>>("/analytics/trends", { params: { page: 1, page_size: limit } }),
};
