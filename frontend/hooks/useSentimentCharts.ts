"use client";

import { useEffect, useState } from "react";
import { sentimentService } from "@/services/sentiment.service";
import type { SentimentChartsData } from "@/services/sentiment.service";
import type { ApiError } from "@/types";

export function useSentimentCharts() {
  const [data, setData] = useState<SentimentChartsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    sentimentService
      .getCharts()
      .then((d) => { if (!cancelled) setData(d); })
      .catch((e) => { if (!cancelled) setError(e as ApiError); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return { data, isLoading, error };
}
