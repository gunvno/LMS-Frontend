"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();

  const redirect = searchParams.get("redirect") || "/dashboard";
  const expired = searchParams.get("expired") === "1";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Vui lòng nhập tài khoản và mật khẩu.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(username.trim(), password);
      router.replace(redirect);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đăng nhập thất bại.";
      setError(msg);
    } finally {
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
          <span className="eyebrow">Học tập tập trung</span>
          <h1>Đăng nhập để tiếp tục khóa học, quiz và chứng chỉ của bạn.</h1>
          <p>Theo dõi tiến độ từng bài, hoàn thành quiz bắt buộc và nhận chứng chỉ khi đủ điều kiện.</p>
        </div>
        <div className="login-benefits">
          <span>Theo dõi tiến độ từng khóa</span>
          <span>Làm quiz bắt buộc để hoàn thành</span>
          <span>Tra cứu chứng chỉ theo mã</span>
        </div>
      </section>

      <section className="login-card">
        <div className="form-heading">
          <span className="eyebrow">Đăng nhập</span>
          <h2>Chào mừng quay lại</h2>
          <p>Dùng tài khoản học viên để vào lớp học.</p>
        </div>

        {expired && (
          <div className="form-info">
            Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.
          </div>
        )}

        <form onSubmit={submit} className="auth-form">
          <label className="form-field">
            <span>Tài khoản</span>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              type="text"
              placeholder="Email hoặc username"
              disabled={loading}
              autoComplete="username"
            />
          </label>
          <label className="form-field">
            <span>Mật khẩu</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="Nhập mật khẩu"
              disabled={loading}
              autoComplete="current-password"
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-button full-button" type="submit" disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
        </form>
        <div className="form-footer" style={{ marginTop: 10 }}>
          <Link href="/forgot-password">Quên mật khẩu?</Link>
        </div>
        <div className="form-footer">
          Chưa có tài khoản?{" "}
          <Link href="/register">Đăng ký</Link>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <main className="loading-screen">
        <div className="loading-card">
          <span className="brand-symbol">E</span>
          <strong>Đang tải...</strong>
        </div>
      </main>
    }>
      <LoginForm />
    </Suspense>
  );
}
