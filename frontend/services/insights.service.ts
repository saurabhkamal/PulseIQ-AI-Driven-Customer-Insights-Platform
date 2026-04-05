import { apiClient } from "@/lib/api-client";
import type { Insight, PaginatedResponse } from "@/types";

interface GetInsightsParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  priority?: "high" | "medium" | "low";
}

export const insightsService = {
  getInsights(params: GetInsightsParams = {}): Promise<PaginatedResponse<Insight>> {
    return apiClient.get<PaginatedResponse<Insight>>("/insights", {
      params: {
        page: params.page ?? 1,
        page_size: params.limit ?? params.pageSize ?? 20,
        ...(params.priority ? { priority: params.priority } : {}),
      },
    });
  },

  getInsight(id: string): Promise<Insight> {
    return apiClient.get<Insight>(`/insights/${id}`);
  },

  refreshInsights(): Promise<{ jobId: string }> {
    return apiClient.post<{ jobId: string }>("/insights/refresh");
  },
};
