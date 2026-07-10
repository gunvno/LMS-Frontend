"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { User, Role, Permission } from "@/lib/types";
import {
  getAccessToken,
  getRefreshToken,
  setTokens,
  clearAuth,
  getStoredUser,
  setStoredUser,
  getStoredRoles,
  setStoredRoles,
  getStoredPermissions,
  setStoredPermissions,
} from "@/lib/student-auth";
import { authService } from "@/services/auth.service";

const STUDENT_ROLE = "STUDENT";

interface AuthContextValue {
  user: User | null;
  roles: Role[];
  permissions: Permission[];
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeRole(role: Role): string {
  if (typeof role === "string") {
    return role.toUpperCase();
  }
  return (role.name || role.description || "").toUpperCase();
}

function decodeJwtPayload(token: string): Record<string, unknown> {
  try {
    const payload = token.split(".")[1];
    if (!payload) return {};
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(normalized.length + ((4 - normalized.length % 4) % 4), "=");
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function userFromTokenAndLoginResponse(token: string, res?: {
  userName?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}): User {
  const claims = decodeJwtPayload(token);
  const username = res?.userName || String(claims.username || "");
  const email = res?.email || String(claims.email || "");
  return {
    id: String(claims.sub || ""),
    username,
    email,
    firstName: res?.firstName || username,
    lastName: res?.lastName || "",
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!getAccessToken();

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      return;
    }

    try {
      const [userRoles, userPerms] = await Promise.all([
        authService.getMyRoles().catch(() => [] as Role[]),
        authService.getMyPermissions().catch(() => [] as Permission[]),
      ]);
      const userInfo = getStoredUser() || userFromTokenAndLoginResponse(token);
      setUser(userInfo);
      setStoredUser(userInfo);

      const roleList = Array.isArray(userRoles) ? userRoles : [];
      setRoles(roleList);
      setStoredRoles(roleList);

      const permList = Array.isArray(userPerms) ? userPerms : [];
      setPermissions(permList);
      setStoredPermissions(permList);
    } catch {
      // Keep stored data if API fails
    }
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      clearAuth();
      setUser(null);
      setRoles([]);
      setPermissions([]);

      const res = await authService.login({ username, password });
      const accessToken = res.token || res.accessToken || "";
      const refreshToken = res.refreshToken || "";
      setTokens(accessToken, refreshToken);

      const [userRoles, userPerms] = await Promise.all([
        authService.getMyRoles(),
        authService.getMyPermissions().catch(() => [] as Permission[]),
      ]);

      const roleList = Array.isArray(userRoles) ? userRoles : [];
      if (!roleList.some((role) => normalizeRole(role) === STUDENT_ROLE)) {
        clearAuth();
        throw new Error("Tài khoản này không phải học viên. Vui lòng dùng tài khoản học viên để đăng nhập.");
      }

      const permList = Array.isArray(userPerms) ? userPerms : [];
      const userInfo = userFromTokenAndLoginResponse(accessToken, res);
      setUser(userInfo);
      setStoredUser(userInfo);
      setRoles(roleList);
      setStoredRoles(roleList);
      setPermissions(permList);
      setStoredPermissions(permList);
    },
    []
  );

  const logout = useCallback(async () => {
    const token = getRefreshToken() || getAccessToken();
    try {
      if (token) await authService.logout(token);
    } catch {
      // ignore logout API errors
    }
    clearAuth();
    setUser(null);
    setRoles([]);
    setPermissions([]);
    router.replace("/login");
  }, [router]);

  // On mount: restore from localStorage, then refresh from API
  useEffect(() => {
    const token = getAccessToken();
    if (token) {
      // Instant restore from storage
      const storedUser = getStoredUser();
      if (storedUser) setUser(storedUser);
      setRoles(getStoredRoles());
      setPermissions(getStoredPermissions());
      // Background refresh
      refreshUser().finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        roles,
        permissions,
        isAuthenticated,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
