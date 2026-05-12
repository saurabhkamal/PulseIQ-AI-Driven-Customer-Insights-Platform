"use client";

import { useEffect, useState } from "react";
import { trendsService } from "@/services/trends.service";
import type { TrendsInsights } from "@/services/trends.service";
import type { ApiError } from "@/types";

export function useTrendsInsights() {
  const [data, setData] = useState<TrendsInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    trendsService
      .getTrendsInsights()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e as ApiError); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { data, isLoading, error };
}
