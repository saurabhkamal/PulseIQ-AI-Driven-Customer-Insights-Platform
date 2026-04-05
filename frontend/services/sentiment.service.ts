import { apiClient } from "@/lib/api-client";
import type { SentimentResult, SentimentSummary, PaginatedResponse } from "@/types";

interface GetSentimentParams {
  page?: number;
  pageSize?: number;
  productId?: string;
  label?: "positive" | "neutral" | "negative";
}

export const sentimentService = {
  getSentimentResults(
    params: GetSentimentParams = {}
  ): Promise<PaginatedResponse<SentimentResult>> {
    return apiClient.get<PaginatedResponse<SentimentResult>>("/sentiment", {
      params: {
        page: params.page ?? 1,
        page_size: params.pageSize ?? 20,
        ...(params.productId ? { product_id: params.productId } : {}),
        ...(params.label ? { label: params.label } : {}),
      },
    });
  },

  getSentimentSummary(): Promise<SentimentSummary> {
    return apiClient.get<SentimentSummary>("/sentiment/summary");
  },
};
