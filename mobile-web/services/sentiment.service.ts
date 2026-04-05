import { apiClient } from "@/lib/api-client";
import type { SentimentSummary, SentimentResult, PaginatedResponse } from "@/types";
export const sentimentService = {
  getSummary: () => apiClient.get<SentimentSummary>("/sentiment/summary"),
  getResults: (limit = 10) =>
    apiClient.get<PaginatedResponse<SentimentResult>>("/sentiment", { params: { page: 1, page_size: limit } }),
};
