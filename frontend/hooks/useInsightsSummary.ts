"use client";

import { useEffect, useState } from "react";
import { insightsService } from "@/services/insights.service";
import type { InsightsSummary } from "@/services/insights.service";
import type { ApiError } from "@/types";

export function useInsightsSummary() {
  const [data, setData] = useState<InsightsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    insightsService
      .getSummary()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e as ApiError); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { data, isLoading, error };
}
