/* ──────────────────────────────────────────────────────────
   LMS Mini — Learning Service
   ────────────────────────────────────────────────────────── */

import { api, toQuery, wrap } from "@/lib/api-client";
import type { Enrollment, Certificate, PageData } from "@/lib/types";

export const learningService = {
  /** Đăng ký khóa học */
  enrollCourse: (courseId: string) =>
    api.post<Enrollment>(
      `/learning/api/v1/courses/${courseId}/enroll`,
      wrap({})
    ),

  /** Lấy danh sách khóa học đã đăng ký */
  getMyCourses: (params: Record<string, unknown> = {}) =>
    api.get<PageData<Enrollment> | Enrollment[]>(
      `/learning/api/v1/my-courses?${toQuery({ page: 0, size: 50, ...params })}`
    ),

  /** Bắt đầu bài học */
  startLesson: (lessonId: string) =>
    api.post<unknown>(
      `/learning/api/v1/lessons/${lessonId}/start`
    ),

  /** Hoàn thành bài học */
  completeLesson: (lessonId: string) =>
    api.post<unknown>(
      `/learning/api/v1/lessons/${lessonId}/complete`
    ),

  /** Đánh giá hoàn thành khóa học và sinh chứng chỉ nếu đủ điều kiện */
  completeCourse: (courseId: string) =>
    api.post<Enrollment>(
      `/learning/api/v1/courses/${courseId}/complete`
    ),

  /** Lấy chứng chỉ của user hiện tại */
  getMyCertificates: (params: Record<string, unknown> = {}) =>
    api.get<PageData<Certificate> | Certificate[]>(
      `/learning/api/v1/my-certificates?${toQuery({ page: 0, size: 50, ...params })}`
    ),

  /** Xác minh chứng chỉ theo code */
  verifyCertificate: (code: string) =>
    api.get<Certificate>(`/learning/api/v1/certificates/${code}`),
};
