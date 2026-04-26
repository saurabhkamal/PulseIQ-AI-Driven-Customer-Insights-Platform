import { apiClient } from "@/lib/api-client";
import type { SentimentResult, SentimentSummary, PaginatedResponse } from "@/types";

interface GetSentimentParams {
  page?: number;
  pageSize?: number;
  productId?: string;
  label?: "positive" | "neutral" | "negative";
}

interface RawSentimentResult {
  id: string;
  feedback_id: string;
  sentiment: SentimentResult["label"];
  score: number;
  confidence: number;
  product_id: string | null;
  product_name: string | null;
  analyzed_at: string;
}

interface RawSentimentSummary {
  positive_pct: number;
  neutral_pct: number;
  negative_pct: number;
  average_score: number;
  total: number;
}

interface RawSentimentResponse {
  summary: RawSentimentSummary;
  data: RawSentimentResult[];
  total: number;
  page: number;
  limit: number;
}

function toSentimentResult(r: RawSentimentResult): SentimentResult {
  return {
    id: r.id,
    feedbackId: r.feedback_id,
    label: r.sentiment,
    score: r.score,
    productId: r.product_id ?? undefined,
    productName: r.product_name ?? undefined,
    createdAt: r.analyzed_at,
  };
}

function toSentimentSummary(r: RawSentimentSummary): SentimentSummary {
  return {
    positive: Math.round((r.positive_pct / 100) * r.total),
    neutral: Math.round((r.neutral_pct / 100) * r.total),
    negative: Math.round((r.negative_pct / 100) * r.total),
    averageScore: r.average_score,
    total: r.total,
  };
}

export const sentimentService = {
  async getSentimentResults(
    params: GetSentimentParams = {}
  ): Promise<PaginatedResponse<SentimentResult>> {
    const raw = await apiClient.get<RawSentimentResponse>("/sentiment", {
      params: {
        page: params.page ?? 1,
        page_size: params.pageSize ?? 20,
        ...(params.productId ? { product_id: params.productId } : {}),
        ...(params.label ? { label: params.label } : {}),
      },
    });
    const pageSize = params.pageSize ?? 20;
    return {
      data: raw.data.map(toSentimentResult),
      meta: {
        page: raw.page,
        pageSize,
        total: raw.total,
        totalPages: Math.ceil(raw.total / pageSize),
      },
    };
  },

  async getSentimentSummary(): Promise<SentimentSummary> {
    const raw = await apiClient.get<RawSentimentSummary>("/sentiment/summary");
    return toSentimentSummary(raw);
  },
};
