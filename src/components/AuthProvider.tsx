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

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  const refreshUser = useCallback(async () => {
    try {
      const [currentUser, userRoles, userPerms] = await Promise.all([
        authService.me(),
        authService.getMyRoles().catch(() => [] as Role[]),
        authService.getMyPermissions().catch(() => [] as Permission[]),
      ]);
      setUser(currentUser);
      setStoredUser(currentUser);

      const roleList = Array.isArray(userRoles) ? userRoles : [];
      setRoles(roleList);
      setStoredRoles(roleList);

      const permList = Array.isArray(userPerms) ? userPerms : [];
      setPermissions(permList);
      setStoredPermissions(permList);
    } catch {
      clearAuth();
      setUser(null);
      setRoles([]);
      setPermissions([]);
    }
  }, []);

  const login = useCallback(
    async (username: string, password: string) => {
      clearAuth();
      setUser(null);
      setRoles([]);
      setPermissions([]);

      let sessionCreated = false;
      try {
        await authService.login({ username, password });
        sessionCreated = true;

        const [currentUser, userRoles, userPerms] = await Promise.all([
          authService.me(),
          authService.getMyRoles(),
          authService.getMyPermissions().catch(() => [] as Permission[]),
        ]);

        const roleList = Array.isArray(userRoles) ? userRoles : [];
        if (!roleList.some((role) => normalizeRole(role) === STUDENT_ROLE)) {
          throw new Error(
            "Tài khoản này không phải học viên. Vui lòng dùng tài khoản học viên để đăng nhập."
          );
        }

        const permList = Array.isArray(userPerms) ? userPerms : [];
        setUser(currentUser);
        setStoredUser(currentUser);
        setRoles(roleList);
        setStoredRoles(roleList);
        setPermissions(permList);
        setStoredPermissions(permList);
      } catch (error) {
        if (sessionCreated) {
          await authService.logout().catch(() => undefined);
        }
        clearAuth();
        throw error;
      }
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // ignore logout API errors
    }
    clearAuth();
    setUser(null);
    setRoles([]);
    setPermissions([]);
    router.replace("/login");
  }, [router]);

  // Restore non-sensitive UI state, then validate the HttpOnly session with the API.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedUser = getStoredUser();
      if (storedUser) setUser(storedUser);
      setRoles(getStoredRoles());
      setPermissions(getStoredPermissions());
      void refreshUser().finally(() => setIsLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
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
