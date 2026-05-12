import { apiClient } from "@/lib/api-client";

export interface AnalystQueryRequest {
  question: string;
  session_id?: string;
}

export interface AnalystQueryResponse {
  answer: string;
  status: "ok" | "blocked" | "error";
  tool_calls_made: number;
  guardrail_triggered: boolean;
  latency_ms: number;
  session_id: string;
}

export const analystService = {
  query(req: AnalystQueryRequest): Promise<AnalystQueryResponse> {
    return apiClient.post<AnalystQueryResponse>("/analyst/query", req);
  },
};
