export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  organization_id: string;
}

export interface AuthState {
  access_token: string;
  user: AuthUser;
}

const TOKEN_KEY = "pulseiq_admin_auth";

export function getAuth(): AuthState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(TOKEN_KEY);
    return raw ? (JSON.parse(raw) as AuthState) : null;
  } catch {
    return null;
  }
}

export function setAuth(state: AuthState): void {
  localStorage.setItem(TOKEN_KEY, JSON.stringify(state));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export function getToken(): string | null {
  return getAuth()?.access_token ?? null;
}
