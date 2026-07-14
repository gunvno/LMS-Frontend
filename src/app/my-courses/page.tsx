"use client";

import { useEffect, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { StudentShell } from "@/components/StudentShell";
import { CourseCard } from "@/components/CourseCard";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { CourseGridSkeleton } from "@/components/LoadingSkeleton";
import { learningService } from "@/services/learning.service";
import { courseService } from "@/services/course.service";
import type { Course, Enrollment } from "@/lib/types";

function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && "content" in data && Array.isArray((data as { content: unknown }).content))
    return (data as { content: T[] }).content;
  return [];
}

export default function MyCoursesPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Map<string, Course>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await learningService.getMyCourses();
      const list = normalizeList<Enrollment>(data);
      setEnrollments(list);

      const courseMap = new Map<string, Course>();
      await Promise.all(
        list.map(async (e) => {
          try {
            const c = await courseService.getCourse(e.courseId);
            courseMap.set(e.courseId, c);
          } catch { /* skip */ }
        })
      );
      setCourses(courseMap);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không tải được dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchData(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <AuthGate>
      <StudentShell>
        <section className="page-heading">
          <div>
            <span className="eyebrow">Khóa của tôi</span>
            <h1>Khóa học đã đăng ký</h1>
            <p>Xem tiến độ, tiếp tục bài học hoặc hoàn thành khóa.</p>
          </div>
        </section>

        {loading ? (
          <CourseGridSkeleton count={4} />
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : enrollments.length === 0 ? (
          <EmptyState
            title="Bạn chưa đăng ký khóa học nào"
            description="Khám phá danh sách khóa học và bắt đầu hành trình học tập."
            action={{ label: "Xem khóa học", href: "/courses" }}
          />
        ) : (
          <section className="course-grid">
            {enrollments.map((enrollment) => {
              const course = courses.get(enrollment.courseId);
              if (!course) return null;
              return (
                <CourseCard
                  key={enrollment.id}
                  course={course}
                  enrollment={enrollment}
                />
              );
            })}
          </section>
        )}
      </StudentShell>
    </AuthGate>
  );
}
