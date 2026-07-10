"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    phone: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const validate = (): string | null => {
    if (!form.firstName.trim()) return "Vui lòng nhập họ.";
    if (!form.lastName.trim()) return "Vui lòng nhập tên.";
    if (!form.email.trim()) return "Vui lòng nhập email.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      return "Email không hợp lệ.";
    if (!form.username.trim()) return "Vui lòng nhập tên đăng nhập.";
    if (form.password.length < 6)
      return "Mật khẩu phải có ít nhất 6 ký tự.";
    if (form.password !== form.confirmPassword)
      return "Mật khẩu nhập lại không khớp.";
    return null;
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const registerData = {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        username: form.username,
        password: form.password,
        phone: form.phone,
      };
      window.sessionStorage.setItem("lms_pending_registration", JSON.stringify(registerData));
      router.push(`/verify-otp?email=${encodeURIComponent(form.email.trim())}&send=1`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đăng ký thất bại.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-hero">
        <Link className="student-brand" href="/">
          <span className="brand-symbol">E</span>
          <span>
            <strong>EduFlow</strong>
            <small>Cổng học viên</small>
          </span>
        </Link>
        <div>
          <span className="eyebrow">Tạo tài khoản</span>
          <h1>Đăng ký để bắt đầu hành trình học tập của bạn.</h1>
          <p>Truy cập hàng trăm khóa học, theo dõi tiến độ và nhận chứng chỉ hoàn thành.</p>
        </div>
        <div className="login-benefits">
          <span>Đăng ký miễn phí, bắt đầu học ngay</span>
          <span>Hoàn thành quiz để nhận chứng chỉ</span>
          <span>Quản lý tiến độ học tập cá nhân</span>
        </div>
      </section>

      <section className="login-card">
        <div className="form-heading">
          <span className="eyebrow">Đăng ký</span>
          <h2>Tạo tài khoản học viên</h2>
          <p>Điền thông tin bên dưới để tạo tài khoản.</p>
        </div>

        <form onSubmit={submit} className="auth-form">
          <div className="form-row">
            <label className="form-field">
              <span>Họ *</span>
              <input
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                placeholder="Nguyễn"
                disabled={loading}
              />
            </label>
            <label className="form-field">
              <span>Tên *</span>
              <input
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                placeholder="Văn A"
                disabled={loading}
              />
            </label>
          </div>
          <label className="form-field">
            <span>Email *</span>
            <input
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              type="email"
              placeholder="email@example.com"
              disabled={loading}
            />
          </label>
          <label className="form-field">
            <span>Tên đăng nhập *</span>
            <input
              value={form.username}
              onChange={(e) => update("username", e.target.value)}
              placeholder="username"
              disabled={loading}
            />
          </label>
          <label className="form-field">
            <span>Mật khẩu *</span>
            <input
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              type="password"
              placeholder="Ít nhất 6 ký tự"
              disabled={loading}
            />
          </label>
          <label className="form-field">
            <span>Nhập lại mật khẩu *</span>
            <input
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              type="password"
              placeholder="Nhập lại mật khẩu"
              disabled={loading}
            />
          </label>
          <label className="form-field">
            <span>Số điện thoại</span>
            <input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              type="tel"
              placeholder="Không bắt buộc"
              disabled={loading}
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-button full-button" type="submit" disabled={loading}>
            {loading ? "Đang xử lý..." : "Tiếp tục xác thực email"}
          </button>
        </form>
        <div className="form-footer">
          Đã có tài khoản?{" "}
          <Link href="/login">Đăng nhập</Link>
        </div>
      </section>
    </main>
  );
}
