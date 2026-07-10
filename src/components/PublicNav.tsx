"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAuth } from "@/components/AuthProvider";

/** Public navigation header for unauthenticated pages */
export function PublicNav({ children }: { children?: ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const displayName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || user.email
    : "Học viên";

  return (
    <main className="student-shell">
      <header className="student-nav">
        <Link className="student-brand" href="/" aria-label="EduFlow trang chủ">
          <span className="brand-symbol">E</span>
          <span>
            <strong>EduFlow</strong>
            <small>Cổng học viên</small>
          </span>
        </Link>
        <nav className="nav-links" aria-label="Điều hướng trang chủ">
          <Link href="/courses">Khóa học</Link>
          <Link href="/certificates">Chứng chỉ</Link>
        </nav>
        <div className="student-actions">
          {!isLoading && isAuthenticated ? (
            <>
              <Link className="ghost-button" href="/dashboard">{displayName}</Link>
              <Link className="primary-button" href="/dashboard">Vào học</Link>
            </>
          ) : (
            <>
              <Link className="ghost-button" href="/login">Đăng nhập</Link>
              <Link className="primary-button" href="/register">Đăng ký</Link>
            </>
          )}
        </div>
      </header>
      {children}
    </main>
  );
}
