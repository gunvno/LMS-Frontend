"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import {
  INPUT_LIMITS,
  normalizePhone,
  validateEmail,
  validateName,
  validatePassword,
  validatePhone,
  validateUsername,
} from "@/lib/form-validation";

type FormField = "firstName" | "lastName" | "email" | "username" | "password" | "confirmPassword" | "phone";
type FormErrors = Partial<Record<FormField, string>>;

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
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);

  const validateField = (field: FormField, value = form[field]): string => {
    if (field === "firstName") return validateName(value, "Họ");
    if (field === "lastName") return validateName(value, "Tên");
    if (field === "email") return validateEmail(value);
    if (field === "username") return validateUsername(value);
    if (field === "password") return validatePassword(value);
    if (field === "confirmPassword") {
      if (!value) return "Vui lòng nhập lại mật khẩu.";
      return value === form.password ? "" : "Mật khẩu nhập lại không khớp.";
    }
    return validatePhone(value);
  };

  const update = (field: FormField, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const validate = (): FormErrors => {
    const nextErrors = {} as FormErrors;
    (Object.keys(form) as FormField[]).forEach((field) => {
      const message = validateField(field);
      if (message) nextErrors[field] = message;
    });
    return nextErrors;
  };

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setSubmitError("");
      return;
    }
    setErrors({});
    setSubmitError("");
    setLoading(true);
    try {
      const registerData = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim().toLowerCase(),
        username: form.username.trim(),
        password: form.password,
        phone: normalizePhone(form.phone),
      };
      window.sessionStorage.setItem("lms_pending_registration", JSON.stringify(registerData));
      router.push(`/verify-otp?email=${encodeURIComponent(form.email.trim())}&send=1`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đăng ký thất bại.";
      setSubmitError(msg);
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
                onBlur={() => setErrors((prev) => ({ ...prev, firstName: validateField("firstName") }))}
                placeholder="Nguyễn"
                maxLength={INPUT_LIMITS.name}
                autoComplete="family-name"
                aria-invalid={Boolean(errors.firstName)}
                aria-describedby={errors.firstName ? "first-name-error" : undefined}
                disabled={loading}
              />
              {errors.firstName && <small id="first-name-error" className="field-error" role="alert">{errors.firstName}</small>}
            </label>
            <label className="form-field">
              <span>Tên *</span>
              <input
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                onBlur={() => setErrors((prev) => ({ ...prev, lastName: validateField("lastName") }))}
                placeholder="Văn A"
                maxLength={INPUT_LIMITS.name}
                autoComplete="given-name"
                aria-invalid={Boolean(errors.lastName)}
                aria-describedby={errors.lastName ? "last-name-error" : undefined}
                disabled={loading}
              />
              {errors.lastName && <small id="last-name-error" className="field-error" role="alert">{errors.lastName}</small>}
            </label>
          </div>
          <label className="form-field">
            <span>Email *</span>
            <input
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              onBlur={() => setErrors((prev) => ({ ...prev, email: validateField("email") }))}
              type="email"
              placeholder="email@example.com"
              maxLength={INPUT_LIMITS.email}
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
              disabled={loading}
            />
            {errors.email && <small id="email-error" className="field-error" role="alert">{errors.email}</small>}
          </label>
          <label className="form-field">
            <span>Tên đăng nhập *</span>
            <input
              value={form.username}
              onChange={(e) => update("username", e.target.value)}
              onBlur={() => setErrors((prev) => ({ ...prev, username: validateField("username") }))}
              placeholder="username"
              minLength={3}
              maxLength={INPUT_LIMITS.username}
              autoComplete="username"
              aria-invalid={Boolean(errors.username)}
              aria-describedby={errors.username ? "username-error" : undefined}
              disabled={loading}
            />
            {errors.username && <small id="username-error" className="field-error" role="alert">{errors.username}</small>}
          </label>
          <label className="form-field">
            <span>Mật khẩu *</span>
            <input
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              onBlur={() => setErrors((prev) => ({
                ...prev,
                password: validateField("password"),
                ...(form.confirmPassword ? { confirmPassword: form.confirmPassword === form.password ? "" : "Mật khẩu nhập lại không khớp." } : {}),
              }))}
              type="password"
              placeholder="Ít nhất 6 ký tự"
              minLength={6}
              maxLength={INPUT_LIMITS.password}
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? "password-error" : undefined}
              disabled={loading}
            />
            {errors.password && <small id="password-error" className="field-error" role="alert">{errors.password}</small>}
          </label>
          <label className="form-field">
            <span>Nhập lại mật khẩu *</span>
            <input
              value={form.confirmPassword}
              onChange={(e) => update("confirmPassword", e.target.value)}
              onBlur={() => setErrors((prev) => ({ ...prev, confirmPassword: validateField("confirmPassword") }))}
              type="password"
              placeholder="Nhập lại mật khẩu"
              minLength={6}
              maxLength={INPUT_LIMITS.password}
              autoComplete="new-password"
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
              disabled={loading}
            />
            {errors.confirmPassword && <small id="confirm-password-error" className="field-error" role="alert">{errors.confirmPassword}</small>}
          </label>
          <label className="form-field">
            <span>Số điện thoại</span>
            <input
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
              onBlur={() => setErrors((prev) => ({ ...prev, phone: validateField("phone") }))}
              type="tel"
              placeholder="Ví dụ: 0912345678"
              maxLength={INPUT_LIMITS.phone}
              inputMode="tel"
              autoComplete="tel"
              aria-invalid={Boolean(errors.phone)}
              aria-describedby={errors.phone ? "phone-error" : undefined}
              disabled={loading}
            />
            {errors.phone && <small id="phone-error" className="field-error" role="alert">{errors.phone}</small>}
          </label>
          {submitError && <div className="form-error" role="alert">{submitError}</div>}
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
