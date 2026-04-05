import { apiClient } from "@/lib/api-client";
import type { Insight, PaginatedResponse } from "@/types";
export const insightsService = {
  getInsights: (limit = 10) =>
    apiClient.get<PaginatedResponse<Insight>>("/insights", { params: { page: 1, page_size: limit } }),
};
