export type UserRole = "admin" | "analyst" | "marketer" | "viewer";
export type UserStatus = "active" | "inactive" | "invited";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  organizationId: string;
  createdAt: string;
  lastActiveAt?: string;
}

export interface DataSource {
  id: string;
  name: string;
  type: "rest_api" | "csv_upload" | "webhook";
  status: "active" | "error" | "paused";
  organizationId: string;
  lastSyncAt?: string;
  createdAt: string;
}

export interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  organizationId: string;
  createdAt: string;
  lastUsedAt?: string;
  isActive: boolean;
}

export interface IngestionJob {
  jobId: string;
  orgId: string;
  dataSource: string;
  status: "pending" | "processing" | "complete" | "failed";
  recordCount?: number;
  failedCount?: number;
  createdAt: string;
  completedAt?: string;
  errorMessage?: string;
}

export interface AuditLogEntry {
  id: string;
  userId: string;
  userEmail: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress?: string;
  organizationId: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
