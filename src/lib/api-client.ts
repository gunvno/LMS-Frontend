/* ──────────────────────────────────────────────────────────
   LMS Mini — API Client
   Shared HTTP client qua API Gateway
   ────────────────────────────────────────────────────────── */

const BASE_URL =
  (typeof process !== "undefined" &&
    process.env?.NEXT_PUBLIC_API_GATEWAY_URL) ||
  "http://localhost:8080";

function isPublicAuthEndpoint(endpoint: string): boolean {
  return [
    "/auth/token",
    "/auth/login",
    "/auth/register",
    "/auth/otp-register",
    "/auth/otp-verify",
    "/auth/forgot-password/otp",
    "/auth/forgot-password/reset",
    "/auth/refresh",
    "/auth/logout",
  ].some((path) => endpoint === path || endpoint.startsWith(`${path}?`));
}

let refreshPromise: Promise<boolean> | null = null;

function clearSessionAndRedirect() {
  if (typeof window === "undefined") return;
  [
    "lms_access_token",
    "lms_refresh_token",
    "lms_user",
    "lms_roles",
    "lms_permissions",
  ].forEach((key) => window.localStorage.removeItem(key));

  const currentPath = `${window.location.pathname}${window.location.search}`;
  if (window.location.pathname !== "/login") {
    window.location.href = `/login?redirect=${encodeURIComponent(currentPath)}&expired=1`;
  }
}

async function performSessionRefresh(): Promise<boolean> {
  try {
    const response = await fetch(`${BASE_URL}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Accept-Language": "vi",
      },
    });
    return response.ok;
  } catch {
    return false;
  }
}

function refreshSession(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = performSessionRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

// ── Request wrapper ───────────────────────────────────────

export function wrap<T>(data: T) {
  return { data, channel: "WEB", signature: "" };
}

// ── Query string builder ──────────────────────────────────

export function toQuery(params: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== "") {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
    }
  }
  return parts.join("&");
}

// ── API Error ─────────────────────────────────────────────

export class ApiError extends Error {
  status: number;
  errorCode: string;

  constructor(message: string, status: number, errorCode: string = "") {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errorCode = errorCode;
  }
}

type ApiClientOptions = RequestInit;

const ERROR_MESSAGES: Record<string, string> = {
  "payos.not_configured": "Chưa cấu hình PayOS. Vui lòng kiểm tra biến môi trường thanh toán.",
  "payos.create_failed": "Không tạo được link thanh toán PayOS. Vui lòng thử lại sau.",
  "payos.invalid_webhook": "Webhook PayOS không hợp lệ.",
  "payment.amount_invalid": "Số tiền thanh toán không hợp lệ.",
  "payment.amount_mismatch": "Số tiền thanh toán không khớp với khóa học.",
  "payment.not_found": "Không tìm thấy giao dịch thanh toán.",
  "payment.cannot_cancel": "Chỉ có thể hủy giao dịch đang chờ thanh toán.",
  "payment.already_paid": "Ngân hàng đã ghi nhận thanh toán nên giao dịch không thể hủy.",
  "payment.cancel_not_confirmed": "PayOS chưa xác nhận hủy giao dịch. Hệ thống giữ nguyên trạng thái để tránh mất thanh toán.",
  "payment.enrollment_pending": "Thanh toán đã thành công. Hệ thống đang thêm khóa học vào tài khoản của bạn.",
  "payos.cancel_failed": "Không hủy được liên kết thanh toán PayOS. Vui lòng thử lại.",
  "must not be blank": "Vui lòng kiểm tra các trường bắt buộc.",
};

function normalizeErrorMessage(message: unknown, fallback: string): string {
  if (typeof message !== "string" || !message.trim()) return fallback;
  return ERROR_MESSAGES[message] || message;
}

// ── Main client ───────────────────────────────────────────

export async function apiClient<T>(
  endpoint: string,
  options: ApiClientOptions = {}
): Promise<T> {
  return executeRequest<T>(endpoint, options, true);
}

export async function apiBlob(endpoint: string, options: RequestInit = {}): Promise<Blob> {
  return executeBlobRequest(endpoint, options, true);
}

async function executeBlobRequest(
  endpoint: string,
  options: RequestInit,
  allowRefresh: boolean
): Promise<Blob> {
  const headers = new Headers(options.headers);
  headers.set("Accept-Language", "vi");

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers,
  });

  if (response.status === 401) {
    if (allowRefresh && typeof window !== "undefined") {
      const refreshed = await refreshSession();
      if (refreshed) return executeBlobRequest(endpoint, options, false);
    }
    clearSessionAndRedirect();
    throw new ApiError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.", 401);
  }

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new ApiError(
      normalizeErrorMessage(payload?.message, `Không tải được file (${response.status})`),
      response.status,
      payload?.errorCode
    );
  }

  return response.blob();
}

async function executeRequest<T>(
  endpoint: string,
  options: ApiClientOptions,
  allowRefresh: boolean
): Promise<T> {
  const headers = new Headers(options.headers);
  const publicAuthEndpoint = isPublicAuthEndpoint(endpoint);

  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept-Language", "vi");

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    credentials: "include",
    headers,
  });

  // Handle empty response (204, etc.)
  const text = await res.text();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let json: any = null;
  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      // not JSON
    }
  }

  // Access token expired: refresh once, then retry the original request.
  if (res.status === 401 && !publicAuthEndpoint) {
    if (allowRefresh && typeof window !== "undefined") {
      const refreshed = await refreshSession();
      if (refreshed) {
        return executeRequest<T>(endpoint, options, false);
      }
    }
    clearSessionAndRedirect();
    throw new ApiError(
      normalizeErrorMessage(json?.message, "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."),
      401,
      json?.errorCode
    );
  }

  // Other errors
  if (!res.ok || (json?.errorCode && json.errorCode !== "EV-200")) {
    throw new ApiError(
      normalizeErrorMessage(json?.message, `Có lỗi xảy ra (${res.status})`),
      res.status,
      json?.errorCode
    );
  }

  // Return the `data` field if present (standard wrapper), else raw json
  return (json?.data ?? json) as T;
}

// ── Convenience methods ───────────────────────────────────

export const api = {
  get: <T>(endpoint: string) => apiClient<T>(endpoint),

  post: <T>(endpoint: string, body?: unknown) =>
    apiClient<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),

  put: <T>(endpoint: string, body?: unknown) =>
    apiClient<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),

  delete: <T>(endpoint: string) =>
    apiClient<T>(endpoint, { method: "DELETE" }),
};
