"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearStudentSession, type StudentSession } from "@/lib/student-auth";

const navItems = [
  { href: "/dashboard", label: "Tổng quan" },
  { href: "/courses", label: "Khóa học" },
  { href: "/quiz", label: "Quiz" },
  { href: "/certificates", label: "Chứng chỉ" },
  { href: "/account", label: "Tài khoản" },
];

type StudentShellProps = {
  session: StudentSession;
  children: React.ReactNode;
};

export function StudentShell({ session, children }: StudentShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = () => {
    clearStudentSession();
    router.replace("/login");
  };

  return (
    <main className="student-shell app-shell">
      <header className="student-nav app-topbar">
        <Link className="student-brand" href="/dashboard" aria-label="EduFlow trang học viên">
          <span className="brand-symbol">E</span>
          <span>
            <strong>EduFlow</strong>
            <small>Cổng học viên</small>
          </span>
        </Link>

        <nav className="nav-links app-nav" aria-label="Điều hướng học viên">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={pathname === item.href || pathname.startsWith(`${item.href}/`) ? "active" : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="student-actions app-user">
          <Link className="ghost-button" href="/dashboard">Thông báo</Link>
          <Link className="user-chip" href="/account" aria-label="Tài khoản học viên">
            <span>{session.name.charAt(0).toUpperCase()}</span>
            <strong>{session.name}</strong>
          </Link>
          <button className="logout-button" onClick={logout}>Đăng xuất</button>
        </div>
      </header>
      {children}
    </main>
  );
}
