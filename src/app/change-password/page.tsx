"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { StudentShell } from "@/components/StudentShell";
import { useToast } from "@/components/Toast";
import { authService } from "@/services/auth.service";
import { Key } from "lucide-react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const toast = useToast();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("Vui lòng điền đầy đủ các trường.");
      return;
    }
    if (newPassword.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu mới và xác nhận không khớp.");
      return;
    }

    setLoading(true);
    try {
      await authService.changePassword({
        oldPassword,
        newPassword,
        confirmPassword,
      });
      toast.success("Đổi mật khẩu thành công!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
      router.replace("/profile");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đổi mật khẩu thất bại.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGate>
      <StudentShell>
        <section className="page-heading">
          <div>
            <span className="eyebrow">Bảo mật</span>
            <h1>Đổi mật khẩu</h1>
            <p>Cập nhật mật khẩu để bảo vệ tài khoản.</p>
          </div>
        </section>

        <section style={{ maxWidth: 480 }}>
          <div className="settings-card">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Key size={20} />
              <h2 style={{ margin: 0 }}>Mật khẩu</h2>
            </div>
            <form onSubmit={submit} className="auth-form">
              <label className="form-field">
                <span>Mật khẩu hiện tại</span>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  disabled={loading}
                />
              </label>
              <label className="form-field">
                <span>Mật khẩu mới</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Ít nhất 6 ký tự"
                  disabled={loading}
                />
              </label>
              <label className="form-field">
                <span>Xác nhận mật khẩu mới</span>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  disabled={loading}
                />
              </label>
              {error && <div className="form-error">{error}</div>}
              <button className="primary-button full-button" type="submit" disabled={loading}>
                {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
              </button>
            </form>
            <Link href="/profile" className="back-link" style={{ marginTop: 16 }}>
              ← Quay lại hồ sơ
            </Link>
          </div>
        </section>
      </StudentShell>
    </AuthGate>
  );
}
