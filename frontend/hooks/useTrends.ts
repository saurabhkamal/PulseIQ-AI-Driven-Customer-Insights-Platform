"use client";

import { useEffect, useState } from "react";
import { trendsService } from "@/services/trends.service";
import type { TrendPrediction, ApiError } from "@/types";

interface UseTrendsParams {
  limit?: number;
}

interface UseTrendsResult {
  trends: TrendPrediction[];
  isLoading: boolean;
  error: ApiError | null;
  total: number;
}

export function useTrends(params: UseTrendsParams = {}): UseTrendsResult {
  const [trends, setTrends] = useState<TrendPrediction[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchTrends() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await trendsService.getTrends(params);
        if (!cancelled) {
          setTrends(response.data);
          setTotal(response.meta.total);
        }
      } catch (err) {
        if (!cancelled) setError(err as ApiError);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchTrends();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.limit]);

  return { trends, isLoading, error, total };
}
