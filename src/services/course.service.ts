/* ──────────────────────────────────────────────────────────
   LMS Mini — Course Service
   ────────────────────────────────────────────────────────── */

import { api, apiBlob, toQuery } from "@/lib/api-client";
import type {
  Course,
  CourseCategory,
  CourseImage,
  Lesson,
  LessonResource,
  PageData,
} from "@/lib/types";

const BASE_URL =
  (typeof process !== "undefined" &&
    process.env?.NEXT_PUBLIC_API_GATEWAY_URL) ||
  "http://localhost:8080";

export const courseService = {
  /** Lấy danh mục khóa học */
  getCategories: (params: Record<string, unknown> = {}) =>
    api.get<PageData<CourseCategory> | CourseCategory[]>(
      `/course/api/v1/course-categories/catalog${Object.keys(params).length > 0 ? `?${toQuery(params)}` : ""}`
    ),

  /** Lấy danh sách khóa học */
  getCourses: (params: Record<string, unknown> = {}) =>
    api.get<PageData<Course>>(
      `/course/api/v1/courses/published?${toQuery({ page: 0, size: 12, ...params })}`
    ),

  /** Chi tiết khóa học */
  getCourse: (id: string) =>
    api.get<Course>(`/course/api/v1/courses/${id}`),

  /** Lấy metadata ảnh khóa học */
  getCourseImages: (courseId: string) =>
    api.get<CourseImage[]>(`/course/api/v1/courses/${courseId}/images`),

  /** URL xem ảnh chính khóa học (dùng trực tiếp trong <img src>) */
  getCourseImageUrl: (courseId: string) =>
    `${BASE_URL}/course/api/v1/courses/${courseId}/images/primary/view`,

  /** URL xem ảnh theo imageId */
  getImageViewUrl: (imageId: string) =>
    `${BASE_URL}/course/api/v1/images/${imageId}/view`,

  /** Lấy danh sách bài học theo khóa */
  getLessonsByCourse: (courseId: string, params: Record<string, unknown> = {}) =>
    api.get<PageData<Lesson> | Lesson[]>(
      `/course/api/v1/courses/${courseId}/lessons?${toQuery({ page: 0, size: 100, ...params })}`
    ),

  /** Chi tiết bài học */
  getLesson: (id: string) =>
    api.get<Lesson>(`/course/api/v1/lessons/${id}`),

  /** Lấy tài nguyên bài học */
  getLessonResources: (params: Record<string, unknown> = {}) =>
    api.get<PageData<LessonResource> | LessonResource[]>(
      `/course/api/v1/lesson-resources?${toQuery(params)}`
    ),

  /** Chi tiết tài nguyên */
  getLessonResource: (id: string) =>
    api.get<LessonResource>(`/course/api/v1/lesson-resources/${id}`),

  /** Tải nội dung tài nguyên có gắn access token */
  viewLessonResource: (id: string) =>
    apiBlob(`/course/api/v1/lesson-resources/${id}/view`),

  /** Tải file tài nguyên có gắn access token */
  downloadLessonResource: (id: string) =>
    apiBlob(`/course/api/v1/lesson-resources/${id}/download`),
};
