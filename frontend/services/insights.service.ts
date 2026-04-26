import { apiClient } from "@/lib/api-client";
import type { Insight, PaginatedResponse } from "@/types";

interface GetInsightsParams {
  page?: number;
  pageSize?: number;
  limit?: number;
  priority?: "high" | "medium" | "low";
}

interface RawInsight {
  id: string;
  type: string;
  priority: Insight["priority"];
  title: string;
  description: string;
  supporting_data?: Record<string, unknown>;
  source_agent: string;
  model_used: string;
  generated_at: string;
  expires_at?: string;
  organization_id?: string;
}

interface RawMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

function toInsight(r: RawInsight): Insight {
  const summary = r.supporting_data
    ? Object.entries(r.supporting_data)
        .map(([k, v]) => `${k.replace(/_/g, " ")}: ${v}`)
        .join(" · ")
    : undefined;
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    priority: r.priority,
    agentType: r.source_agent,
    model: r.model_used,
    sourceDataSummary: summary,
    createdAt: r.generated_at,
    organizationId: r.organization_id ?? "",
  };
}

export const insightsService = {
  async getInsights(params: GetInsightsParams = {}): Promise<PaginatedResponse<Insight>> {
    const raw = await apiClient.get<{ data: RawInsight[]; meta: RawMeta }>("/insights", {
      params: {
        page: params.page ?? 1,
        page_size: params.limit ?? params.pageSize ?? 20,
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

  async getInsight(id: string): Promise<Insight> {
    const raw = await apiClient.get<RawInsight>(`/insights/${id}`);
    return toInsight(raw);
  },

  refreshInsights(): Promise<{ jobId: string }> {
    return apiClient.post<{ jobId: string }>("/insights/refresh");
  },
};
