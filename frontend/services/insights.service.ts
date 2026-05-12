import { apiClient } from "@/lib/api-client";
import type { Insight, PaginatedResponse } from "@/types";

export interface InsightPriorityBreakdown {
  priority: "high" | "medium" | "low";
  count: number;
}

export interface InsightByAgent {
  agent: string;
  total: number;
  high: number;
  medium: number;
  low: number;
}

export interface InsightVolumeWeek {
  week: string;
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface InsightsSummary {
  priority_breakdown: InsightPriorityBreakdown[];
  by_agent: InsightByAgent[];
  volume_by_week: InsightVolumeWeek[];
  total: number;
}

interface GetInsightsParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  priority?: "high" | "medium" | "low";
}

interface RawInsight {
  id: string;
  type: string;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  supporting_data: Record<string, unknown>;
  source_agent: string | null;
  model_used: string | null;
  generated_at: string;
  expires_at: string | null;
}

interface RawPaginatedInsights {
  data: RawInsight[];
  meta: { page: number; page_size: number; total: number; total_pages: number };
}

function toInsight(r: RawInsight): Insight {
  const summaryData = r.supporting_data?.summary ?? r.supporting_data?.insight ?? null;
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    priority: r.priority,
    agentType: r.source_agent ?? r.type ?? "recommendation",
    model: r.model_used ?? "gpt-4o",
    sourceDataSummary: typeof summaryData === "string" ? summaryData : undefined,
    createdAt: r.generated_at,
    organizationId: "",
  };
}

export const insightsService = {
  async getInsights(params: GetInsightsParams = {}): Promise<PaginatedResponse<Insight>> {
    const raw = await apiClient.get<RawPaginatedInsights>("/insights", {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? params.pageSize ?? 20,
        ...(params.priority ? { priority: params.priority } : {}),
      },
    });
    return {
      data: raw.data.map(toInsight),
      meta: {
        page: raw.meta.page,
        pageSize: raw.meta.page_size,
        total: raw.meta.total,
        totalPages: raw.meta.total_pages,
      },
    };
  },

  getInsight(id: string): Promise<Insight> {
    return apiClient.get<Insight>(`/insights/${id}`);
  },

  refreshInsights(): Promise<{ jobId: string }> {
    return apiClient.post<{ jobId: string }>("/insights/refresh");
  },

  getSummary(): Promise<InsightsSummary> {
    return apiClient.get<InsightsSummary>("/insights/summary");
  },
};
