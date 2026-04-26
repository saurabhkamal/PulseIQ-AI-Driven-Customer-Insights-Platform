import type { ApiError } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = new URL(`${this.baseUrl}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) url.searchParams.set(k, String(v));
      });
    }
    return url.toString();
  }

  private async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const { params, ...fetchOptions } = options;
    const { getToken } = await import("./auth");
    const token = getToken();
    const authHeader = token ? { Authorization: `Bearer ${token}` } : {};
    const response = await fetch(this.buildUrl(path, params), {
      ...fetchOptions,
      headers: { "Content-Type": "application/json", ...authHeader, ...fetchOptions.headers },
      credentials: "include",
    });

    if (!response.ok) {
      let errorBody: { error?: ApiError } = {};
      try { errorBody = await response.json(); } catch { /* ignore */ }
      throw errorBody.error ?? { code: String(response.status), message: response.statusText };
    }

    if (response.status === 204) return undefined as T;
    return response.json() as Promise<T>;
  }

  get<T>(path: string, options?: RequestOptions) { return this.request<T>(path, { ...options, method: "GET" }); }
  post<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: "POST", body: body !== undefined ? JSON.stringify(body) : undefined });
  }
  patch<T>(path: string, body?: unknown, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: "PATCH", body: body !== undefined ? JSON.stringify(body) : undefined });
  }
  delete<T>(path: string, options?: RequestOptions) { return this.request<T>(path, { ...options, method: "DELETE" }); }
}

export const apiClient = new ApiClient(API_BASE_URL ?? "http://localhost:8000/api/v1");
