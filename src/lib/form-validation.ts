export const INPUT_LIMITS = {
  name: 50,
  email: 254,
  username: 100,
  password: 128,
  phone: 20,
  search: 100,
  message: 2000,
} as const;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const NAME_PATTERN = /^[\p{L}\p{M}]+(?:[ '\-][\p{L}\p{M}]+)*$/u;
const USERNAME_PATTERN = /^[A-Za-z0-9._-]+$/;
const VIETNAMESE_MOBILE_PATTERN = /^(?:\+84|84|0)(?:3|5|7|8|9)\d{8}$/;
const OTP_PATTERN = /^\d{6}$/;
const CERTIFICATE_CODE_PATTERN = /^LMS-\d{4}-[A-F0-9]{8}$/i;

export function validateName(value: string, label: string): string {
  const normalized = value.trim();
  if (!normalized) return `Vui lòng nhập ${label.toLowerCase()}.`;
  if (normalized.length > INPUT_LIMITS.name)
    return `${label} không được vượt quá ${INPUT_LIMITS.name} ký tự.`;
  if (!NAME_PATTERN.test(normalized))
    return `${label} chỉ được chứa chữ cái, khoảng trắng, dấu nháy đơn hoặc dấu gạch nối.`;
  return "";
}

export function validateEmail(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "Vui lòng nhập email.";
  if (normalized.length > INPUT_LIMITS.email)
    return `Email không được vượt quá ${INPUT_LIMITS.email} ký tự.`;
  if (!EMAIL_PATTERN.test(normalized)) return "Email không đúng định dạng.";
  return "";
}

export function validateUsername(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "Vui lòng nhập tên đăng nhập.";
  if (normalized.length < 3 || normalized.length > INPUT_LIMITS.username)
    return `Tên đăng nhập phải có từ 3 đến ${INPUT_LIMITS.username} ký tự.`;
  if (!USERNAME_PATTERN.test(normalized))
    return "Tên đăng nhập chỉ được chứa chữ cái không dấu, số, dấu chấm, gạch dưới hoặc gạch nối.";
  return "";
}

export function validateLoginIdentifier(value: string): string {
  const normalized = value.trim();
  if (!normalized) return "Vui lòng nhập email hoặc tên đăng nhập.";
  if (normalized.includes("@")) return validateEmail(normalized);
  if (normalized.length > INPUT_LIMITS.username) return "Tên đăng nhập quá dài.";
  return "";
}

export function validatePassword(value: string, label = "Mật khẩu"): string {
  if (!value) return `Vui lòng nhập ${label.toLowerCase()}.`;
  if (value.length < 6) return `${label} phải có ít nhất 6 ký tự.`;
  if (value.length > INPUT_LIMITS.password)
    return `${label} không được vượt quá ${INPUT_LIMITS.password} ký tự.`;
  return "";
}

export function validateExistingPassword(value: string, label = "Mật khẩu"): string {
  if (!value) return `Vui lòng nhập ${label.toLowerCase()}.`;
  if (value.length > INPUT_LIMITS.password)
    return `${label} không được vượt quá ${INPUT_LIMITS.password} ký tự.`;
  return "";
}

export function validatePhone(value: string): string {
  if (!value.trim()) return "";
  const compact = value.replace(/[\s.()-]/g, "");
  if (!VIETNAMESE_MOBILE_PATTERN.test(compact))
    return "Số điện thoại không hợp lệ (ví dụ: 0912345678 hoặc +84912345678).";
  return "";
}

export function normalizePhone(value: string): string {
  const compact = value.trim().replace(/[\s.()-]/g, "");
  if (compact.startsWith("+84")) return `0${compact.slice(3)}`;
  if (compact.startsWith("84")) return `0${compact.slice(2)}`;
  return compact;
}

export function validateOtp(value: string): string {
  if (!value.trim()) return "Vui lòng nhập mã OTP.";
  if (!OTP_PATTERN.test(value.trim())) return "Mã OTP phải gồm đúng 6 chữ số.";
  return "";
}

export function validateCertificateCode(value: string): string {
  if (!value.trim()) return "Vui lòng nhập mã chứng chỉ.";
  if (!CERTIFICATE_CODE_PATTERN.test(value.trim()))
    return "Mã chứng chỉ không đúng định dạng (ví dụ: LMS-2026-A1B2C3D4).";
  return "";
}
