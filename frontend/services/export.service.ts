import { apiClient } from "@/lib/api-client";

export type ExportFormat = "csv" | "xlsx" | "json";
export type ExportDataType =
  | "sales"
  | "customers"
  | "products"
  | "insights"
  | "sentiment"
  | "trends";

export interface ExportJob {
  jobId: string;
  status: "pending" | "processing" | "complete" | "failed";
  downloadUrl?: string;
  createdAt: string;
}

export interface ExportRequest {
  dataType: ExportDataType;
  format: ExportFormat;
  dateFrom?: string;
  dateTo?: string;
}

export const exportService = {
  requestExport(req: ExportRequest): Promise<ExportJob> {
    return apiClient.post<ExportJob>("/export", req);
  },

  getExportStatus(jobId: string): Promise<ExportJob> {
    return apiClient.get<ExportJob>(`/export/${jobId}`);
  },

  getExportHistory(): Promise<ExportJob[]> {
    return apiClient.get<ExportJob[]>("/export/history");
  },
};
