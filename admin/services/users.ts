import { apiClient } from "@/lib/api-client";
import type { AdminUser, PaginatedResponse } from "@/types";

interface RawUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "analyst" | "marketer" | "viewer";
  organization_id: string;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

function toAdminUser(u: RawUser): AdminUser {
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.is_active ? "active" : "inactive",
    organizationId: u.organization_id,
    createdAt: u.created_at,
    lastActiveAt: u.last_login_at ?? undefined,
  };
}

export async function listUsers(
  page = 1,
  pageSize = 20
): Promise<PaginatedResponse<AdminUser>> {
  const res = await apiClient.get<PaginatedResponse<RawUser>>("/users", {
    params: { page, page_size: pageSize },
  });
  return { data: res.data.map(toAdminUser), meta: res.meta };
}
