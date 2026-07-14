"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { noticeService } from "@/services/notice.service";
import type { Notice } from "@/lib/types";
import {
  LayoutDashboard,
  BookOpen,
  ListChecks,
  Award,
  User,
  LogOut,
  Bell,
  FolderOpen,
  ChevronDown,
  ReceiptText,
  MessagesSquare,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/courses", label: "Khóa học", icon: BookOpen },
  { href: "/my-courses", label: "Khóa của tôi", icon: FolderOpen },
  { href: "/messages", label: "Giảng viên", icon: MessagesSquare },
  { href: "/quiz", label: "Quiz", icon: ListChecks },
];

export function StudentShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [notices, setNotices] = useState<Notice[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [noticeLoading, setNoticeLoading] = useState(false);
  const [noticeError, setNoticeError] = useState("");

  const displayName =
    user
      ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || user.email
      : "Học viên";

  const handleLogout = async () => {
    await logout();
  };

  const loadNotices = async () => {
    try {
      setNoticeLoading(true);
      setNoticeError("");
      const [page, unread] = await Promise.all([
        noticeService.getMyNotices({ page: 0, size: 5 }),
        noticeService.getUnreadCount(),
      ]);
      setNotices(page.content || []);
      setUnreadCount(unread || 0);
    } catch (err) {
      setNoticeError(err instanceof Error ? err.message : "Không tải được thông báo.");
    } finally {
      setNoticeLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadNotices();
    }
  }, [user]);

  const handleMarkRead = async (notice: Notice) => {
    if (notice.readStatus === "READ") return;
    try {
      const updated = await noticeService.markRead(notice.recipientId);
      setNotices((prev) =>
        prev.map((item) => item.recipientId === notice.recipientId ? updated : item)
      );
      setUnreadCount((count) => Math.max(0, count - 1));
    } catch (err) {
      setNoticeError(err instanceof Error ? err.message : "Không cập nhật được thông báo.");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await noticeService.markAllRead();
      setNotices((prev) => prev.map((item) => ({ ...item, readStatus: "READ" })));
      setUnreadCount(0);
    } catch (err) {
      setNoticeError(err instanceof Error ? err.message : "Không cập nhật được thông báo.");
    }
  };

  const formatNoticeDate = (value?: string) => {
    if (!value) return "Vừa xong";
    const date = new Date(value);
    if (!Number.isFinite(date.getTime())) return "Vừa xong";
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
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
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              pathname === item.href ||
              pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={isActive ? "active" : undefined}
              >
                <Icon size={16} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="student-actions app-user">
          <details className="notification-menu" onToggle={(event) => {
            if ((event.currentTarget as HTMLDetailsElement).open) {
              loadNotices();
            }
          }}>
            <summary className="icon-button notification-trigger" aria-label="Mở thông báo">
              <Bell size={18} />
              {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
            </summary>
            <div className="notification-dropdown">
              <div className="notification-head">
                <div>
                  <strong>Thông báo</strong>
                  <span>{unreadCount} chưa đọc</span>
                </div>
                <button type="button" onClick={handleMarkAllRead} disabled={!unreadCount}>
                  Đọc tất cả
                </button>
              </div>
              {noticeError && <p className="notification-error">{noticeError}</p>}
              {noticeLoading && <p className="notification-empty">Đang tải...</p>}
              {!noticeLoading && notices.length === 0 && (
                <p className="notification-empty">Bạn chưa có thông báo nào.</p>
              )}
              {!noticeLoading && notices.map((notice) => (
                <button
                  key={notice.recipientId}
                  type="button"
                  className={`notification-item ${notice.readStatus === "UNREAD" ? "unread" : ""}`}
                  onClick={() => handleMarkRead(notice)}
                >
                  <span className="notification-dot" />
                  <span className="notification-copy">
                    <strong>{notice.title}</strong>
                    <small>{notice.content}</small>
                    <em>{formatNoticeDate(notice.sentAt || notice.createdDate)}</em>
                  </span>
                </button>
              ))}
            </div>
          </details>
          <details className="account-menu">
            <summary className="user-chip" aria-label="Mở menu tài khoản">
              <span>{displayName.charAt(0).toUpperCase()}</span>
              <strong>{displayName}</strong>
              <ChevronDown className="account-menu-chevron" size={16} />
            </summary>
            <div className="account-dropdown">
              <Link href="/profile">
                <User size={16} />
                Thông tin cá nhân
              </Link>
              <Link href="/certificates">
                <Award size={16} />
                Chứng chỉ của tôi
              </Link>
              <Link href="/payment/history">
                <ReceiptText size={16} />
                Lịch sử thanh toán
              </Link>
              <button onClick={handleLogout}>
                <LogOut size={16} />
                Đăng xuất
              </button>
            </div>
          </details>
        </div>
      </header>
      {children}
    </main>
  );
}
