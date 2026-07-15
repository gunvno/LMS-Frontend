/* ──────────────────────────────────────────────────────────
   LMS Mini — Auth Service
   ────────────────────────────────────────────────────────── */

import { api, apiClient } from "@/lib/api-client";
import type {
  LoginRequest,
  RegisterRequest,
  OtpRequest,
  OtpVerifyRequest,
  ChangePasswordRequest,
  ForgotPasswordOtpRequest,
  ForgotPasswordResetRequest,
  User,
  Role,
  Permission,
} from "@/lib/types";

export const authService = {
  /** Đăng nhập bằng username/password */
  login: (payload: LoginRequest) =>
    api.post<unknown>("/auth/token", payload),

  /** Đăng ký tài khoản học viên */
  register: (data: RegisterRequest) =>
    api.post<unknown>("/auth/register", data),

  /** Gửi OTP đăng ký qua email */
  sendOtp: (data: OtpRequest) =>
    api.post<unknown>("/auth/otp-register", data),

  /** Xác thực OTP */
  verifyOtp: (data: OtpVerifyRequest) =>
    api.post<unknown>("/auth/otp-verify", data),

  /** Lấy thông tin user hiện tại */
  me: async () => {
    const data = await apiClient<{
      sub?: string;
      preferred_username?: string;
      email?: string;
      given_name?: string;
      family_name?: string;
    }>("/auth/userinfo", { method: "POST" });
    return {
      id: data.sub || "",
      username: data.preferred_username || "",
      email: data.email || "",
      firstName: data.given_name || data.preferred_username || "",
      lastName: data.family_name || "",
    } satisfies User;
  },

  /** Đăng xuất */
  logout: () =>
    api.post<unknown>("/auth/logout"),

  /** Đổi mật khẩu */
  changePassword: (data: ChangePasswordRequest) =>
    api.post<unknown>("/auth/change-password", data),

  /** Gửi OTP quên mật khẩu */
  sendForgotPasswordOtp: (data: ForgotPasswordOtpRequest) =>
    api.post<unknown>("/auth/forgot-password/otp", data),

  /** Đặt lại mật khẩu bằng OTP */
  resetPassword: (data: ForgotPasswordResetRequest) =>
    api.post<unknown>("/auth/forgot-password/reset", data),

  /** Lấy roles của user hiện tại */
  getMyRoles: () =>
    api.get<Role[]>("/author/api/v1/users/me/roles"),

  /** Lấy permissions của user hiện tại */
  getMyPermissions: () =>
    api.get<Permission[]>("/author/api/v1/users/me/permissions"),
};
