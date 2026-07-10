"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

export function AuthGate({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
    }
  }, [isLoading, isAuthenticated, router, pathname]);

  if (isLoading || !isAuthenticated) {
    return (
      <main className="loading-screen">
        <div className="loading-card">
          <span className="brand-symbol">E</span>
          <strong>Đang kiểm tra phiên đăng nhập...</strong>
          <p>Vui lòng chờ trong giây lát.</p>
        </div>
      </main>
    );
  }

  return <>{children}</>;
}
