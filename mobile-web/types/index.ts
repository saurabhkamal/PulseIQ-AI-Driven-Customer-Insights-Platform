export type UserRole = "admin" | "analyst" | "marketer" | "viewer";
export type TrendDirection = "up" | "down" | "flat";
export type InsightPriority = "high" | "medium" | "low";
export type SentimentLabel = "positive" | "neutral" | "negative";
export type SignalStrength = "high" | "medium" | "low";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId: string;
  organizationName: string;
  createdAt: string;
}

export interface KpiMetric {
  id: string;
  label: string;
  formattedValue: string;
  trend: TrendDirection;
  trendValue: string;
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  priority: InsightPriority;
  agentType: string;
  model: string;
  createdAt: string;
  organizationId: string;
}

export interface TrendPrediction {
  id: string;
  trendName: string;
  description: string;
  signalStrength: SignalStrength;
  confidence: number;
  forecastPeriod: string;
  createdAt: string;
}

export interface SentimentSummary {
  positive: number;
  neutral: number;
  negative: number;
  averageScore: number;
  total: number;
}

export interface SentimentResult {
  id: string;
  feedbackId: string;
  label: SentimentLabel;
  score: number;
  productName?: string;
  createdAt: string;
}

export interface PushSubscriptionData {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export interface ApiError {
  code: string;
  message: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}
