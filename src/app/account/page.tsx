"use client";

import { AuthGate } from "@/components/AuthGate";
import { StudentShell } from "@/components/StudentShell";

export default function AccountPage() {
  return (
    <AuthGate>
      {(session) => (
        <StudentShell session={session}>
          <section className="page-heading">
            <div>
              <span className="eyebrow">Tài khoản</span>
              <h1>Thông tin học viên</h1>
              <p>Quản lý thông tin cá nhân, bảo mật và tùy chọn học tập.</p>
            </div>
          </section>

          <section className="account-grid">
            <article className="profile-card">
              <div className="profile-avatar">{session.name.charAt(0).toUpperCase()}</div>
              <h2>{session.name}</h2>
              <p>{session.email}</p>
              <span>Vai trò: Học viên</span>
            </article>

            <article className="settings-card">
              <h2>Thông tin cơ bản</h2>
              <label className="form-field">
                <span>Họ tên</span>
                <input defaultValue={session.name} />
              </label>
              <label className="form-field">
                <span>Email</span>
                <input defaultValue={session.email} />
              </label>
              <button className="primary-button">Lưu thay đổi</button>
            </article>

            <article className="settings-card">
              <h2>Bảo mật</h2>
              <label className="form-field">
                <span>Mật khẩu hiện tại</span>
                <input type="password" placeholder="Nhập mật khẩu hiện tại" />
              </label>
              <label className="form-field">
                <span>Mật khẩu mới</span>
                <input type="password" placeholder="Nhập mật khẩu mới" />
              </label>
              <button className="ghost-button">Đổi mật khẩu</button>
            </article>
          </section>
        </StudentShell>
      )}
    </AuthGate>
  );
}
