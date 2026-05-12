import { apiClient } from "@/lib/api-client";
import type { SentimentResult, SentimentSummary, PaginatedResponse } from "@/types";

export interface SentimentWeek {
  week: string;
  positive: number;
  neutral: number;
  negative: number;
  total: number;
}

export interface SentimentBySource {
  source: string;
  positive: number;
  neutral: number;
  negative: number;
  total: number;
}

export interface SentimentByProduct {
  product: string;
  positive: number;
  neutral: number;
  negative: number;
  total: number;
}

export interface SentimentChartsData {
  weekly_trend: SentimentWeek[];
  by_source: SentimentBySource[];
  by_product: SentimentByProduct[];
}

interface GetSentimentParams {
  page?: number;
  pageSize?: number;
  productId?: string;
  label?: "positive" | "neutral" | "negative";
}

interface RawSentimentResult {
  id: string;
  feedback_id: string;
  sentiment: "positive" | "neutral" | "negative";
  score: number;
  confidence: number;
  analyzed_at: string;
  product_name: string | null;
}

interface RawSentimentSummary {
  positive: number;
  neutral: number;
  negative: number;
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
    createdAt: r.analyzed_at,
    productName: r.product_name ?? undefined,
  };
}

function toSentimentSummary(r: RawSentimentSummary): SentimentSummary {
  return {
    positive: r.positive,
    neutral: r.neutral,
    negative: r.negative,
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
        limit: params.pageSize ?? 20,
        ...(params.productId ? { product_id: params.productId } : {}),
        ...(params.label ? { sentiment: params.label } : {}),
      },
    });
    const page = raw.page ?? 1;
    const limit = raw.limit ?? 20;
    const total = raw.total ?? 0;
    return {
      data: raw.data.map(toSentimentResult),
      meta: {
        page,
        pageSize: limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  },

  async getSentimentSummary(): Promise<SentimentSummary> {
    const raw = await apiClient.get<RawSentimentSummary>("/sentiment/summary");
    return toSentimentSummary(raw);
  },

  getCharts(): Promise<SentimentChartsData> {
    return apiClient.get<SentimentChartsData>("/sentiment/charts");
  },
};
