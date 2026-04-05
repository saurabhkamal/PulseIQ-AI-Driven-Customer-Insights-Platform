"use client";

import { useEffect, useState } from "react";
import { sentimentService } from "@/services/sentiment.service";
import type { SentimentSummary, ApiError } from "@/types";

interface UseSentimentSummaryResult {
  summary: SentimentSummary | null;
  isLoading: boolean;
  error: ApiError | null;
}

export function useSentimentSummary(): UseSentimentSummaryResult {
  const [summary, setSummary] = useState<SentimentSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchSummary() {
      setIsLoading(true);
      setError(null);
      try {
        const data = await sentimentService.getSentimentSummary();
        if (!cancelled) setSummary(data);
      } catch (err) {
        if (!cancelled) setError(err as ApiError);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchSummary();
    return () => {
      cancelled = true;
    };
  }, []);

  return { summary, isLoading, error };
}
