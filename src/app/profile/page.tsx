"use client";

import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { StudentShell } from "@/components/StudentShell";
import { useAuth } from "@/components/AuthProvider";
import { Key, Mail, Phone, User, Shield } from "lucide-react";

export default function ProfilePage() {
  const { user, roles } = useAuth();

  const displayName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || ""
    : "";

  const roleNames = roles
    .map((r) => (typeof r === "string" ? r : r.name || r.description || ""))
    .join(", ") || "Học viên";

  return (
    <AuthGate>
      <StudentShell>
        <section className="page-heading">
          <div>
            <span className="eyebrow">Hồ sơ</span>
            <h1>Thông tin học viên</h1>
            <p>Xem thông tin cá nhân và quản lý bảo mật.</p>
          </div>
        </section>

        <section className="account-grid">
          <article className="profile-card">
            <div className="profile-avatar">
              {displayName.charAt(0).toUpperCase() || "U"}
            </div>
            <h2>{displayName}</h2>
            <p>{user?.email || ""}</p>
            <span><Shield size={14} style={{ marginRight: 4 }} /> {roleNames}</span>
          </article>

          <article className="settings-card">
            <h2>Thông tin cơ bản</h2>
            <div className="profile-info-row">
              <User size={16} />
              <div>
                <small>Họ tên</small>
                <strong>{displayName || "—"}</strong>
              </div>
            </div>
            <div className="profile-info-row">
              <Mail size={16} />
              <div>
                <small>Email</small>
                <strong>{user?.email || "—"}</strong>
              </div>
            </div>
            <div className="profile-info-row">
              <User size={16} />
              <div>
                <small>Tên đăng nhập</small>
                <strong>{user?.username || "—"}</strong>
              </div>
            </div>
            {user?.phone && (
              <div className="profile-info-row">
                <Phone size={16} />
                <div>
                  <small>Số điện thoại</small>
                  <strong>{user.phone}</strong>
                </div>
              </div>
            )}
          </article>

          <article className="settings-card">
            <h2>Bảo mật</h2>
            <p style={{ color: "var(--muted)", marginBottom: 16 }}>
              Quản lý mật khẩu và bảo mật tài khoản.
            </p>
            <Link className="ghost-button" href="/change-password">
              <Key size={16} style={{ marginRight: 6 }} />
              Đổi mật khẩu
            </Link>
          </article>
        </section>
      </StudentShell>
    </AuthGate>
  );
}
