"use client";

import { useEffect, useState } from "react";
import { sentimentService } from "@/services/sentiment.service";
import type { SentimentResult, ApiError, SentimentLabel } from "@/types";

interface UseSentimentResultsParams {
  page?: number;
  pageSize?: number;
  label?: SentimentLabel;
}

interface UseSentimentResultsResult {
  results: SentimentResult[];
  isLoading: boolean;
  error: ApiError | null;
  total: number;
  totalPages: number;
}

export function useSentimentResults(
  params: UseSentimentResultsParams = {}
): UseSentimentResultsResult {
  const [results, setResults] = useState<SentimentResult[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    sentimentService
      .getSentimentResults(params)
      .then((res) => {
        if (!cancelled) {
          setResults(res.data);
          setTotal(res.meta.total);
          setTotalPages(res.meta.totalPages);
        }
      })
      .catch((e) => { if (!cancelled) setError(e as ApiError); })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.page, params.pageSize, params.label]);

  return { results, isLoading, error, total, totalPages };
}
