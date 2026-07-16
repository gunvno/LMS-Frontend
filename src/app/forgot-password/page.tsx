"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import { INPUT_LIMITS, validateEmail, validateOtp, validatePassword } from "@/lib/form-validation";

type Step = "EMAIL" | "RESET";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("EMAIL");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const requestOtp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) return setError(emailError);

    try {
      setLoading(true);
      setError("");
      await authService.sendForgotPasswordOtp({ email: email.trim() });
      setMessage("Mã OTP đã được gửi tới email của bạn.");
      setStep("RESET");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không gửi được OTP.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const otpError = validateOtp(otp);
    if (otpError) return setError(otpError);
    const passwordError = validatePassword(newPassword, "Mật khẩu mới");
    if (passwordError) return setError(passwordError);
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await authService.resetPassword({
        email: email.trim(),
        inputOtp: otp.trim(),
        newPassword,
        confirmPassword,
      });
      router.replace("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không đặt lại được mật khẩu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="loading-screen">
      <section className="otp-card">
        <Link className="student-brand" href="/" style={{ justifyContent: "center" }}>
          <span className="brand-symbol">E</span>
        </Link>
        <div className="form-heading" style={{ textAlign: "center" }}>
          <span className="eyebrow">Quên mật khẩu</span>
          <h2>{step === "EMAIL" ? "Nhận mã OTP" : "Đặt lại mật khẩu"}</h2>
          <p>
            {step === "EMAIL"
              ? "Nhập email tài khoản, hệ thống sẽ gửi mã OTP để xác minh."
              : `Nhập OTP đã gửi tới ${email} và mật khẩu mới.`}
          </p>
        </div>

        {step === "EMAIL" ? (
          <form className="auth-form" onSubmit={requestOtp}>
            <label className="form-field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="email@example.com"
                maxLength={INPUT_LIMITS.email}
                autoComplete="email"
                aria-invalid={Boolean(error) && Boolean(validateEmail(email))}
                disabled={loading}
              />
            </label>
            {error && <div className="form-error">{error}</div>}
            <button className="primary-button full-button" disabled={loading}>
              {loading ? "Đang gửi..." : "Gửi OTP"}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={resetPassword}>
            {message && <div className="form-info">{message}</div>}
            <label className="form-field">
              <span>Mã OTP</span>
              <input
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="Nhập mã 6 ký tự"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                aria-invalid={Boolean(error) && Boolean(validateOtp(otp))}
                disabled={loading}
                style={{ textAlign: "center", letterSpacing: "0.3em", fontSize: 20, fontWeight: 900 }}
              />
            </label>
            <label className="form-field">
              <span>Mật khẩu mới</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Ít nhất 6 ký tự"
                minLength={6}
                maxLength={INPUT_LIMITS.password}
                autoComplete="new-password"
                disabled={loading}
              />
            </label>
            <label className="form-field">
              <span>Nhập lại mật khẩu</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Nhập lại mật khẩu mới"
                minLength={6}
                maxLength={INPUT_LIMITS.password}
                autoComplete="new-password"
                disabled={loading}
              />
            </label>
            {error && <div className="form-error">{error}</div>}
            <button className="primary-button full-button" disabled={loading}>
              {loading ? "Đang cập nhật..." : "Đổi mật khẩu"}
            </button>
          </form>
        )}

        <div className="form-footer" style={{ textAlign: "center" }}>
          <Link href="/login">Quay lại đăng nhập</Link>
        </div>
      </section>
    </main>
  );
}
