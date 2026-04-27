import { apiClient } from "@/lib/api-client";
import type { User } from "@/types";

const TOKEN_KEY   = "piq_access_token";
const REFRESH_KEY = "piq_refresh_token";
const USER_KEY    = "piq_user";

export interface AuthTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    organization_id: string;
  };
}

function toUser(u: AuthTokenResponse["user"]): User {
  return {
    id: u.id,
    email: u.email,
    name: u.name,
    role: u.role as User["role"],
    organizationId: u.organization_id,
    organizationName: "",
    createdAt: new Date().toISOString(),
  };
}

export const authService = {
  async login(email: string, password: string): Promise<AuthTokenResponse> {
    const res = await apiClient.post<AuthTokenResponse>("/auth/login", { email, password });
    this._storeSession(res);
    return res;
  },

  async register(
    name: string,
    email: string,
    password: string,
    organizationName: string
  ): Promise<AuthTokenResponse> {
    const res = await apiClient.post<AuthTokenResponse>("/auth/register", {
      name,
      email,
      password,
      organization_name: organizationName,
    });
    this._storeSession(res);
    return res;
  },

  logout(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser(): User | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  _storeSession(res: AuthTokenResponse): void {
    localStorage.setItem(TOKEN_KEY, res.access_token);
    localStorage.setItem(REFRESH_KEY, res.refresh_token);
    localStorage.setItem(USER_KEY, JSON.stringify(toUser(res.user)));
  },
};
