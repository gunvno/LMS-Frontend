/* ──────────────────────────────────────────────────────────
   LMS Mini — Auth Token & Session Management
   ────────────────────────────────────────────────────────── */

import type { User, Permission, Role } from "./types";

const ACCESS_TOKEN_KEY = "lms_access_token";
const REFRESH_TOKEN_KEY = "lms_refresh_token";
const USER_KEY = "lms_user";
const ROLES_KEY = "lms_roles";
const PERMISSIONS_KEY = "lms_permissions";

// ── Token ─────────────────────────────────────────────────

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken?: string) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

export function clearAuth() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
  window.localStorage.removeItem(ROLES_KEY);
  window.localStorage.removeItem(PERMISSIONS_KEY);
}

// ── User ──────────────────────────────────────────────────

export function getStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

export function setStoredUser(user: User) {
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// ── Roles & Permissions ───────────────────────────────────

export function getStoredRoles(): Role[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(ROLES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Role[];
  } catch {
    return [];
  }
}

export function setStoredRoles(roles: Role[]) {
  window.localStorage.setItem(ROLES_KEY, JSON.stringify(roles));
}

export function getStoredPermissions(): Permission[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(PERMISSIONS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Permission[];
  } catch {
    return [];
  }
}

export function setStoredPermissions(permissions: Permission[]) {
  window.localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(permissions));
}

export function hasPermission(permissionName: string): boolean {
  return getStoredPermissions().some((p) => {
    const current = typeof p === "string" ? p : p.name;
    return current === permissionName;
  });
}

export function hasRole(roleName: string): boolean {
  return getStoredRoles().some((r) => {
    const current = typeof r === "string" ? r : r.name;
    return current === roleName;
  });
}

// ── Quick auth check ──────────────────────────────────────

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}
