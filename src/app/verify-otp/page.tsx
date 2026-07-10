"use client";

import Link from "next/link";
import { FormEvent, Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/services/auth.service";
import type { RegisterRequest } from "@/lib/types";

function OtpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const shouldSend = searchParams.get("send") === "1";
  const initialSendStarted = useRef(false);

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [sendMessage, setSendMessage] = useState(
    shouldSend ? "Đang gửi mã OTP tới email của bạn..." : "Mã OTP có hiệu lực trong 5 phút."
  );

  useEffect(() => {
    if (!shouldSend || !email || initialSendStarted.current) return;
    initialSendStarted.current = true;

    authService.sendOtp({ email })
      .then(() => {
        setSendMessage("Mã OTP đã được gửi tới email của bạn.");
        router.replace(`/verify-otp?email=${encodeURIComponent(email)}`);
      })
      .catch((err: unknown) => {
        setSendMessage("");
        setError(err instanceof Error ? err.message : "Không gửi được OTP. Vui lòng thử lại.");
        setCanResend(true);
        setCountdown(0);
      });
  }, [email, router, shouldSend]);

  // Countdown timer
  useEffect(() => {
    if (countdown <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const resendOtp = useCallback(async () => {
    if (!canResend || !email) return;
    setCanResend(false);
    setCountdown(60);
    setError("");
    setSendMessage("Đang gửi lại mã OTP...");
    try {
      await authService.sendOtp({ email });
      setSendMessage("Mã OTP mới đã được gửi tới email của bạn.");
    } catch (err: unknown) {
      setSendMessage("");
      setError(err instanceof Error ? err.message : "Không gửi được OTP. Vui lòng thử lại.");
      setCanResend(true);
      setCountdown(0);
    }
  }, [canResend, email]);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError("Vui lòng nhập mã OTP.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await authService.verifyOtp({
        email,
        inputOtp: otp.trim(),
        expectedType: "REGISTER",
      });

      const pendingRaw = window.sessionStorage.getItem("lms_pending_registration");
      if (!pendingRaw) {
        throw new Error("Không tìm thấy thông tin đăng ký. Vui lòng quay lại nhập thông tin.");
      }
      const pending = JSON.parse(pendingRaw) as RegisterRequest;
      if (pending.email.trim().toLowerCase() !== email.trim().toLowerCase()) {
        throw new Error("Email xác thực không khớp với thông tin đăng ký.");
      }

      await authService.register(pending);
      window.sessionStorage.removeItem("lms_pending_registration");
      router.replace("/login");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xác thực OTP thất bại.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  if (!email) {
    return (
      <main className="loading-screen">
        <div className="loading-card">
          <span className="brand-symbol">E</span>
          <strong>Thiếu thông tin email</strong>
          <p>Vui lòng đăng ký lại.</p>
          <Link className="primary-button" href="/register">Quay lại đăng ký</Link>
        </div>
      </main>
    );
  }

  return (
    <main className="loading-screen">
      <div className="otp-card">
        <Link className="student-brand" href="/" style={{ justifyContent: "center" }}>
          <span className="brand-symbol">E</span>
        </Link>
        <div className="form-heading" style={{ textAlign: "center" }}>
          <span className="eyebrow">Xác thực email</span>
          <h2>Nhập mã OTP</h2>
          <p>
            Mã xác thực được gửi tới <strong>{email}</strong>.
            Kiểm tra cả hộp thư rác và nhập mã bên dưới.
          </p>
          {sendMessage && <div className="form-info">{sendMessage}</div>}
        </div>
        <form onSubmit={submit} className="auth-form">
          <label className="form-field">
            <span>Mã OTP</span>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="Nhập mã 6 ký tự"
              maxLength={6}
              disabled={loading}
              autoFocus
              style={{ textAlign: "center", letterSpacing: "0.3em", fontSize: 20, fontWeight: 900 }}
            />
          </label>
          {error && <div className="form-error">{error}</div>}
          <button className="primary-button full-button" type="submit" disabled={loading}>
            {loading ? "Đang xác thực..." : "Xác nhận"}
          </button>
        </form>
        <div className="form-footer" style={{ textAlign: "center" }}>
          {canResend ? (
            <button className="ghost-button" onClick={resendOtp}>
              Gửi lại OTP
            </button>
          ) : (
            <span style={{ color: "var(--muted)" }}>
              Gửi lại OTP sau {countdown}s
            </span>
          )}
        </div>
      </div>
    </main>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <main className="loading-screen">
        <div className="loading-card">
          <span className="brand-symbol">E</span>
          <strong>Đang tải...</strong>
        </div>
      </main>
    }>
      <OtpForm />
    </Suspense>
  );
}
