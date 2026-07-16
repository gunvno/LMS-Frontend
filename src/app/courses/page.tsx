"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { CourseCard } from "@/components/CourseCard";
import { StudentShell } from "@/components/StudentShell";
import { PublicNav } from "@/components/PublicNav";
import { EmptyState } from "@/components/EmptyState";
import { INPUT_LIMITS } from "@/lib/form-validation";
import { ErrorState } from "@/components/ErrorState";
import { CourseGridSkeleton } from "@/components/LoadingSkeleton";
import { courseService } from "@/services/course.service";
import { learningService } from "@/services/learning.service";
import type { Course, CourseCategory, Enrollment } from "@/lib/types";

function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && "content" in data && Array.isArray((data as { content: unknown }).content))
    return (data as { content: T[] }).content;
  return [];
}

export default function CoursesPage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);

  const fetchData = useCallback(async (pageNum: number, append = false) => {
    setLoading(true);
    setError("");
    try {
      const params: Record<string, unknown> = { page: pageNum, size: 12 };
      if (categoryId) params.categoryId = categoryId;

      const [courseData, catData] = await Promise.all([
        courseService.getCourses(params),
        categories.length > 0 ? Promise.resolve(null) : courseService.getCategories(),
      ]);

      const courseList = normalizeList<Course>(courseData);
      setCourses(prev => append ? [...prev, ...courseList] : courseList);

      if (catData) {
        setCategories(normalizeList<CourseCategory>(catData));
      }

      // Check pagination
      if (courseData && typeof courseData === "object" && "totalPages" in courseData) {
        setHasMore(pageNum < (courseData as { totalPages: number }).totalPages - 1);
      } else {
        setHasMore(courseList.length >= 12);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không tải được khóa học.");
    } finally {
      setLoading(false);
    }
  }, [categoryId, categories.length]);

  // Fetch enrollments if authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      learningService.getMyCourses().then((data) => {
        setEnrollments(normalizeList<Enrollment>(data));
      }).catch(() => {});
    }
  }, [authLoading, isAuthenticated]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void fetchData(0), 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchData]);

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchData(next, true);
  };

  // Filter published + keyword
  const filteredCourses = useMemo(() => {
    return courses
      .filter((c) => !c.status || c.status === "PUBLISHED")
      .filter((c) => {
        if (!keyword.trim()) return true;
        const hay = `${c.name} ${c.code} ${c.description || ""}`.toLowerCase();
        return hay.includes(keyword.toLowerCase());
      });
  }, [courses, keyword]);

  const findEnrollment = (courseId: string) =>
    enrollments.find((e) => e.courseId === courseId) || null;

  const content = (
    <>
      <section className="page-heading">
        <div>
          <span className="eyebrow">Khóa học</span>
          <h1>Danh sách khóa học</h1>
          <p>Tìm khóa học phù hợp, xem nội dung và đăng ký ngay.</p>
        </div>
      </section>

      <section className="filter-bar">
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Tìm khóa học..."
          maxLength={INPUT_LIMITS.search}
          aria-label="Tìm khóa học"
        />
        <select
          value={categoryId}
          onChange={(e) => {
            setPage(0);
            setCategoryId(e.target.value);
          }}
        >
          <option value="">Tất cả danh mục</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </section>

      {loading && courses.length === 0 ? (
        <CourseGridSkeleton count={6} />
      ) : error ? (
        <ErrorState message={error} onRetry={() => fetchData(0)} />
      ) : filteredCourses.length === 0 ? (
        <EmptyState
          title="Chưa có khóa học phù hợp"
          description="Thử thay đổi bộ lọc hoặc quay lại sau."
        />
      ) : (
        <>
          <section className="course-grid">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                enrollment={findEnrollment(course.id)}
              />
            ))}
          </section>
          {hasMore && (
            <div style={{ textAlign: "center", marginTop: 24 }}>
              <button
                className="ghost-button large"
                onClick={loadMore}
                disabled={loading}
              >
                {loading ? "Đang tải..." : "Xem thêm"}
              </button>
            </div>
          )}
        </>
      )}
    </>
  );

  if (isAuthenticated) {
    return <StudentShell>{content}</StudentShell>;
  }

  return <PublicNav>{content}</PublicNav>;
}
