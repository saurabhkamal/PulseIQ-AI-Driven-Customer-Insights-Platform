"use client";

import { useEffect, useState } from "react";
import { dashboardService } from "@/services/dashboard.service";
import type { KpiMetric, ApiError } from "@/types";

interface UseKpiMetricsResult {
  metrics: KpiMetric[];
  isLoading: boolean;
  error: ApiError | null;
}

export function useKpiMetrics(): UseKpiMetricsResult {
  const [metrics, setMetrics] = useState<KpiMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchMetrics() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await dashboardService.getKpiMetrics();
        if (!cancelled) setMetrics(data);
      } catch (err) {
        if (!cancelled) setError(err as ApiError);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchMetrics();
    return () => {
      cancelled = true;
    };
  }, []);

  return { metrics, isLoading, error };
}
