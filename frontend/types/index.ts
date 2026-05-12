// ─── User & Auth ────────────────────────────────────────────────────────────

export type UserRole = "admin" | "analyst" | "marketer" | "viewer";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ─── API Responses ───────────────────────────────────────────────────────────

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ─── Dashboard / KPI ─────────────────────────────────────────────────────────

export type TrendDirection = "up" | "down" | "flat";

export interface KpiMetric {
  id: string;
  label: string;
  value: string | number;
  formattedValue: string;
  trend: TrendDirection;
  trendValue: string;
  sparkline?: number[];
}

// ─── Insights ────────────────────────────────────────────────────────────────

export type InsightPriority = "high" | "medium" | "low";

export interface Insight {
  id: string;
  title: string;
  description: string;
  priority: InsightPriority;
  agentType: string;
  model: string;
  sourceDataSummary?: string;
  createdAt: string;
  organizationId: string;
}

// ─── Sentiment ───────────────────────────────────────────────────────────────

export type SentimentLabel = "positive" | "neutral" | "negative";

export interface SentimentResult {
  id: string;
  feedbackId: string;
  label: SentimentLabel;
  score: number;
  productId?: string;
  productName?: string;
  createdAt: string;
}

export interface SentimentSummary {
  positive: number;
  neutral: number;
  negative: number;
  averageScore: number;
  total: number;
}

// ─── Compliance ──────────────────────────────────────────────────────────────

export type ComplianceSeverity = "high" | "medium" | "low" | "none";

export type ComplianceSignalType =
  | "vulnerable_customer_cluster"
  | "complaint_spike"
  | "poor_outcome_indicator"
  | "consumer_duty_alert"
  | "tcf_breach_signal"
  | "psd2_consent_issue"
  | "none_detected";

export interface ComplianceSignal {
  id: string;
  signalType: ComplianceSignalType;
  severity: ComplianceSeverity;
  description: string;
  affectedPopulationEstimate: string | null;
  recommendedReviewAction: string;
  regulatoryReference: string | null;
  reviewed: boolean;
  reviewedAt: string | null;
  generatedAt: string;
}

// ─── Trends ──────────────────────────────────────────────────────────────────

export type SignalStrength = "high" | "medium" | "low";

export interface TrendPrediction {
  id: string;
  trendName: string;
  description: string;
  signalStrength: SignalStrength;
  confidence: number;
  forecastPeriod: string;
  createdAt: string;
}
