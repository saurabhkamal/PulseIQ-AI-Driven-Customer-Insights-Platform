"use client";

import { useEffect, useState } from "react";
import { insightsService } from "@/services/insights.service";
import type { Insight, ApiError } from "@/types";

interface UseInsightsParams {
  limit?: number;
  priority?: "high" | "medium" | "low";
}

interface UseInsightsResult {
  insights: Insight[];
  isLoading: boolean;
  error: ApiError | null;
  total: number;
}

export function useInsights(params: UseInsightsParams = {}): UseInsightsResult {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchInsights() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await insightsService.getInsights(params);
        if (!cancelled) {
          setInsights(response.data);
          setTotal(response.meta.total);
        }
      } catch (err) {
        if (!cancelled) setError(err as ApiError);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchInsights();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.limit, params.priority]);

  return { insights, isLoading, error, total };
}
