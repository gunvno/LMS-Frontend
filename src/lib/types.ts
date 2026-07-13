/* ──────────────────────────────────────────────────────────
   LMS Mini — Shared TypeScript Types
   ────────────────────────────────────────────────────────── */

// ── API Wrappers ──────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  status: string;
  errorCode: string;
  message: string;
}

export interface PageData<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export type PageResponse<T> = ApiResponse<PageData<T>>;

// ── Enums ─────────────────────────────────────────────────

export type CourseLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
export type CourseStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type EnrollmentStatus = "ACTIVE" | "COMPLETED" | "CANCELLED";
export type CertificateStatus = "ACTIVE" | "EXPIRED" | "REVOKED";
export type LessonProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
export type QuizAttemptStatus = "IN_PROGRESS" | "SUBMITTED" | "GRADED";
export type NoticeType =
  | "COURSE_SUBMITTED"
  | "COURSE_APPROVED"
  | "COURSE_REJECTED"
  | "COURSE_PUBLISHED"
  | "ENROLLMENT_SUCCESS"
  | "COURSE_COMPLETED"
  | "CERTIFICATE_ISSUED"
  | "SYSTEM";
export type NoticeTargetType = "USER" | "USERS" | "ROLE" | "ALL";
export type NoticeStatus = "DRAFT" | "SENDING" | "SENT" | "FAILED" | "CANCELLED";
export type NoticeDeliveryStatus = "PENDING" | "SENT" | "FAILED";
export type NoticeReadStatus = "UNREAD" | "READ";

// ── Auth ──────────────────────────────────────────────────

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  accessToken?: string;
  refreshToken?: string;
  authenticated?: boolean;
  userName?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  password: string;
  phone?: string;
}

export interface OtpRequest {
  email: string;
}

export interface OtpVerifyRequest {
  email: string;
  inputOtp: string;
  expectedType: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ForgotPasswordOtpRequest {
  email: string;
}

export interface ForgotPasswordResetRequest {
  email: string;
  inputOtp: string;
  newPassword: string;
  confirmPassword: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dob?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export type Role = string | {
  name: string;
  description?: string;
};

export type Permission = string | {
  name: string;
  description?: string;
};

// ── Course ────────────────────────────────────────────────

export interface CourseCategory {
  id: string;
  name: string;
  description?: string;
  status?: "ACTIVE" | "INACTIVE";
}

export interface Course {
  id: string;
  name: string;
  code: string;
  description?: string;
  level?: CourseLevel;
  status?: CourseStatus;
  durationMinutes?: number;
  price?: number;
  categoryId?: string;
  categoryName?: string;
  category?: CourseCategory;
  createdAt?: string;
  updatedAt?: string;
}

export interface CourseImage {
  id: string;
  courseId: string;
  primary?: boolean;
  fileName?: string;
  contentType?: string;
}

// ── Lesson ────────────────────────────────────────────────

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  content?: string;
  description?: string;
  orderIndex?: number;
  durationMinutes?: number;
  videoUrl?: string;
  createdAt?: string;
  locked?: boolean;
}

export interface LessonResource {
  id: string;
  lessonId: string;
  title: string;
  resourceType?: string;
  filePath?: string;
  externalUrl?: string;
  status?: string;
}

// ── Enrollment / Learning ─────────────────────────────────

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  status: EnrollmentStatus;
  progressPercent: number;
  enrolledAt: string;
  completedAt?: string;
  course?: Course;
}

export interface LearningProgress {
  id: string;
  enrollmentId: string;
  lessonId: string;
  status: LessonProgressStatus;
  startedAt?: string;
  completedAt?: string;
}

// ── Certificate ───────────────────────────────────────────

export interface Certificate {
  id: string;
  userId: string;
  courseId: string;
  certificateCode: string;
  issuedAt: string;
  expiresAt?: string;
  status: CertificateStatus;
  courseName?: string;
  userName?: string;
}

export type PaymentStatus = "PENDING" | "PAID" | "CANCELLED" | "EXPIRED" | "FAILED";

export interface Payment {
  id?: string;
  userId?: string;
  courseId: string;
  amount: number;
  provider: string;
  providerOrderCode?: number;
  providerPaymentLinkId?: string;
  providerCheckoutUrl?: string;
  providerQrCode?: string;
  transferContent?: string;
  providerTransactionId?: string;
  invoiceCode?: string;
  invoiceIssuedAt?: string;
  status: PaymentStatus;
  paidAt?: string;
  createdDate?: string;
  createdAt?: string;
  displayDate?: string;
}

export interface Invoice {
  id: string;
  paymentId: string;
  invoiceCode: string;
  userId: string;
  courseId: string;
  amount: number;
  provider: string;
  providerTransactionId?: string;
  status: string;
  issuedAt: string;
  paidAt?: string;
  createdDate?: string;
}

// ── Notice ────────────────────────────────────────────────

export interface Notice {
  noticeId: string;
  recipientId: string;
  userId: string;
  title: string;
  content: string;
  noticeType: NoticeType;
  targetType: NoticeTargetType;
  data?: string;
  status: NoticeStatus;
  deliveryStatus: NoticeDeliveryStatus;
  readStatus: NoticeReadStatus;
  sentAt?: string;
  createdDate?: string;
  readAt?: string;
}

// ── Quiz ──────────────────────────────────────────────────

export interface Quiz {
  id: string;
  courseId?: string;
  lessonId?: string;
  title: string;
  description?: string;
  durationMinutes?: number;
  requiredToComplete?: boolean;
  passingScore?: number;
  maxAttempts?: number;
  questionCount?: number;
}

export interface Question {
  id: string;
  quizId: string;
  content: string;
  questionType?: string;
  orderIndex?: number;
  points?: number;
}

/** Khi render cho student đang làm quiz, bỏ qua field `correct` */
export interface Answer {
  id: string;
  questionId: string;
  content: string;
  correct?: boolean; // ⚠️ KHÔNG hiển thị khi đang làm quiz
  orderIndex?: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  status: QuizAttemptStatus;
  score?: number;
  passed?: boolean;
  startedAt: string;
  submittedAt?: string;
  totalQuestions?: number;
  correctAnswers?: number;
}

export interface QuizSubmitAnswer {
  questionId: string;
  answerId: string;
}
