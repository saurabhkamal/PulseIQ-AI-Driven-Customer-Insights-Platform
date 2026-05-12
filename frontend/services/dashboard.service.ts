import { apiClient } from "@/lib/api-client";
import type { KpiMetric } from "@/types";

interface RawKpiMetric {
  id: string;
  label: string;
  value: number;
  formatted_value: string;
  trend: string;
  trend_value: string;
  sparkline?: number[];
}

function toKpiMetric(r: RawKpiMetric): KpiMetric {
  return {
    id: r.id,
    label: r.label,
    value: r.value,
    formattedValue: r.formatted_value,
    trend: r.trend as KpiMetric["trend"],
    trendValue: r.trend_value,
    sparkline: r.sparkline,
  };
}

// ---------------------------------------------------------------------------
// Dashboard summary types
// ---------------------------------------------------------------------------

export interface RevenueDayPoint {
  date: string;
  revenue: number;
}

export interface TopProductItem {
  id: string;
  name: string;
  revenue: number;
  units: number;
}

export interface ComplianceAlertSummary {
  high_unreviewed: number;
  medium_unreviewed: number;
  low_unreviewed: number;
  total_unreviewed: number;
}

export interface ChurnRiskSummary {
  high: number;
  medium: number;
  low: number;
  total: number;
}

export interface PipelineStatusData {
  last_run_at: string | null;
  insights_total: number;
  sentiment_total: number;
  trends_total: number;
  status: "healthy" | "warning" | "idle";
}

export interface FunnelStageItem {
  stage: string;
  count: number;
  drop_off_pct: number;
}

export interface FunnelHealthData {
  conversion_rate: number;
  stages: FunnelStageItem[];
  total_top: number;
}

export interface NetSentimentWeek {
  week: string;
  score: number;
}

export interface NetSentimentData {
  score: number;
  positive_pct: number;
  negative_pct: number;
  weekly: NetSentimentWeek[];
}

export interface NewVsReturningData {
  new_customers: number;
  returning_customers: number;
  total: number;
  new_pct: number;
  returning_pct: number;
}

export interface DashboardSummary {
  revenue_trend: RevenueDayPoint[];
  top_products: TopProductItem[];
  compliance_alerts: ComplianceAlertSummary;
  churn_risk: ChurnRiskSummary;
  pipeline_status: PipelineStatusData;
  funnel_health: FunnelHealthData;
  net_sentiment: NetSentimentData;
  new_vs_returning: NewVsReturningData;
}

// ---------------------------------------------------------------------------

export const dashboardService = {
  async getKpiMetrics(): Promise<KpiMetric[]> {
    const raw = await apiClient.get<RawKpiMetric[]>("/dashboards/kpi");
    return raw.map(toKpiMetric);
  },

  getSummary(): Promise<DashboardSummary> {
    return apiClient.get<DashboardSummary>("/dashboards/summary");
  },
};
