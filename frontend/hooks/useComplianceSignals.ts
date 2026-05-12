"use client";

import { useEffect, useState } from "react";
import { complianceService } from "@/services/compliance.service";
import type { ComplianceSignal, ApiError } from "@/types";

interface UseComplianceSignalsParams {
  page?: number;
  pageSize?: number;
  severity?: "high" | "medium" | "low";
  reviewed?: boolean;
}

interface UseComplianceSignalsResult {
  signals: ComplianceSignal[];
  isLoading: boolean;
  error: ApiError | null;
  total: number;
  totalPages: number;
}

export function useComplianceSignals(
  params: UseComplianceSignalsParams = {}
): UseComplianceSignalsResult {
  const [signals, setSignals] = useState<ComplianceSignal[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ApiError | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    complianceService
      .getSignals(params)
      .then((res) => {
        if (!cancelled) {
          setSignals(res.data);
          setTotal(res.meta.total);
          setTotalPages(res.meta.totalPages);
        }
      })
      .catch((e) => { if (!cancelled) setError(e as ApiError); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.page, params.pageSize, params.severity, params.reviewed]);

  return { signals, isLoading, error, total, totalPages };
}
