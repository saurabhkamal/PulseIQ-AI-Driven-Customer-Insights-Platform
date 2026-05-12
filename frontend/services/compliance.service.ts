import { apiClient } from "@/lib/api-client";
import type { ComplianceSignal, PaginatedResponse } from "@/types";

interface GetComplianceSignalsParams {
  page?: number;
  pageSize?: number;
  severity?: "high" | "medium" | "low";
  reviewed?: boolean;
}

interface RawSignal {
  id: string;
  signal_type: ComplianceSignal["signalType"];
  severity: ComplianceSignal["severity"];
  description: string;
  affected_population_estimate: string | null;
  recommended_review_action: string;
  regulatory_reference: string | null;
  reviewed: boolean;
  reviewed_at: string | null;
  generated_at: string;
}

interface RawResponse {
  data: RawSignal[];
  meta: { page: number; page_size: number; total: number; total_pages: number };
}

export const complianceService = {
  async getSignals(
    params: GetComplianceSignalsParams = {}
  ): Promise<PaginatedResponse<ComplianceSignal>> {
    const raw = await apiClient.get<RawResponse>("/compliance/signals", {
      params: {
        page: params.page ?? 1,
        page_size: params.pageSize ?? 20,
        ...(params.severity ? { severity: params.severity } : {}),
        ...(params.reviewed !== undefined ? { reviewed: params.reviewed } : {}),
      },
    });
    return {
      data: raw.data.map((r) => ({
        id: r.id,
        signalType: r.signal_type,
        severity: r.severity,
        description: r.description,
        affectedPopulationEstimate: r.affected_population_estimate,
        recommendedReviewAction: r.recommended_review_action,
        regulatoryReference: r.regulatory_reference,
        reviewed: r.reviewed,
        reviewedAt: r.reviewed_at,
        generatedAt: r.generated_at,
      })),
      meta: {
        page: raw.meta.page,
        pageSize: raw.meta.page_size,
        total: raw.meta.total,
        totalPages: raw.meta.total_pages,
      },
    };
  },
};
