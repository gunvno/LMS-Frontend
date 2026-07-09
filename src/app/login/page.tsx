"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { setStudentSession } from "@/lib/student-auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("student@gmail.com");
  const [password, setPassword] = useState("123456");
  const [error, setError] = useState("");

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Vui lòng nhập email và mật khẩu.");
      return;
    }

    const displayName = email.split("@")[0].replace(/[._-]/g, " ");
    setStudentSession({
      email,
      name: displayName.charAt(0).toUpperCase() + displayName.slice(1),
      role: "STUDENT",
    });
    router.replace("/dashboard");
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
          <p>Giao diện này đang dùng session mẫu ở frontend để kiểm thử luồng UI. Khi nối API, form sẽ gọi auth service thật.</p>
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
        <form onSubmit={submit} className="auth-form">
          <label className="form-field">
            <span>Email</span>
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" placeholder="student@gmail.com" />
          </label>
          <label className="form-field">
            <span>Mật khẩu</span>
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" placeholder="Nhập mật khẩu" />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-button full-button" type="submit">Đăng nhập</button>
        </form>
        <div className="demo-account">
          <strong>Tài khoản test</strong>
          <span>student@gmail.com / 123456</span>
        </div>
      </section>
    </main>
  );
}
