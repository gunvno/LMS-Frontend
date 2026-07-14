"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { StudentShell } from "@/components/StudentShell";
import { PublicNav } from "@/components/PublicNav";
import { ErrorState } from "@/components/ErrorState";
import { ProgressBar } from "@/components/ProgressBar";
import { useToast } from "@/components/Toast";
import { courseService } from "@/services/course.service";
import { learningService } from "@/services/learning.service";
import { paymentService } from "@/services/payment.service";
import type { Course, Lesson, Enrollment } from "@/lib/types";
import { BookOpen, Clock, Award, Users } from "lucide-react";

function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && "content" in data && Array.isArray((data as { content: unknown }).content))
    return (data as { content: T[] }).content;
  return [];
}

export default function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const toast = useToast();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrolling, setEnrolling] = useState(false);
  const [imgError, setImgError] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [courseData, lessonData] = await Promise.all([
        courseService.getCourse(courseId),
        courseService.getLessonsByCourse(courseId),
      ]);
      setCourse(courseData);
      const lessonList = normalizeList<Lesson>(lessonData);
      setLessons(lessonList.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không tải được khóa học.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  // Check enrollment
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      learningService.getMyCourses().then((data) => {
        const list = normalizeList<Enrollment>(data);
        const found = list.find((e) => e.courseId === courseId);
        if (found) setEnrollment(found);
      }).catch(() => {});
    }
  }, [authLoading, isAuthenticated, courseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleEnroll = async () => {
    setEnrolling(true);
    setError("");
    try {
      if ((course?.price ?? 0) > 0) {
        const payment = await paymentService.createCoursePayment(courseId);
        if (payment.providerOrderCode) {
          toast.info("Mở màn hình thanh toán EduFlow...");
          router.push(`/payment/checkout?orderCode=${payment.providerOrderCode}`);
          return;
        }
        const message = "Chưa cấu hình PayOS hoặc chưa tạo được link thanh toán.";
        setError(message);
        toast.error(message);
        return;
      }
      const result = await learningService.enrollCourse(courseId);
      setEnrollment(result);
      toast.success("Đăng ký khóa học thành công.");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Đăng ký khóa học thất bại.";
      setError(message);
      toast.error(message);
    } finally {
      setEnrolling(false);
    }
  };

  const levelLabel: Record<string, string> = {
    BEGINNER: "Cơ bản",
    INTERMEDIATE: "Trung cấp",
    ADVANCED: "Nâng cao",
  };

  const totalLessonMinutes = lessons.reduce((sum, lesson) => sum + (lesson.durationMinutes || 0), 0);
  const durationText = totalLessonMinutes
    ? totalLessonMinutes >= 60
      ? `${Math.round(totalLessonMinutes / 60)} giờ học`
      : `${totalLessonMinutes} phút học`
    : "";

  if (loading) {
    return (
      <main className="loading-screen">
        <div className="loading-card">
          <span className="brand-symbol">E</span>
          <strong>Đang tải khóa học...</strong>
        </div>
      </main>
    );
  }

  if (error && !course) {
    return (
      <main className="student-shell">
        <ErrorState message={error} onRetry={fetchData} />
      </main>
    );
  }

  if (!course) return null;

  const content = (
    <>
      <section className="course-detail-hero">
        <div className="course-detail-copy">
          <Link href="/courses" className="back-link">← Quay lại khóa học</Link>
          <span className="eyebrow">{course.categoryName || course.category?.name || ""}</span>
          <h1>{course.name}</h1>
          <p>{course.description}</p>
          <div className="detail-meta">
            {course.code && <span><BookOpen size={14} style={{ marginRight: 4 }} /> {course.code}</span>}
            {course.level && <span><Award size={14} style={{ marginRight: 4 }} /> {levelLabel[course.level] || course.level}</span>}
            {durationText && <span><Clock size={14} style={{ marginRight: 4 }} /> {durationText}</span>}
            <span><Users size={14} style={{ marginRight: 4 }} /> {lessons.length} bài học</span>
            {course.price != null && (
              <span>{course.price > 0 ? `${course.price.toLocaleString("vi-VN")}đ` : "Miễn phí"}</span>
            )}
          </div>

          {enrollment && (
            <>
              <ProgressBar value={enrollment.progressPercent} />
              <div className="course-meta" style={{ marginTop: 8 }}>
                <span>{enrollment.progressPercent}% hoàn thành</span>
                <span className="pill">
                  {enrollment.status === "COMPLETED" ? "Hoàn thành" : "Đang học"}
                </span>
              </div>
            </>
          )}

          <div style={{ marginTop: 24 }}>
            {enrollment ? (
              <Link className="primary-button large" href={`/learn/${courseId}`}>
                {enrollment.status === "COMPLETED" ? "Học lại" : "Vào học"}
              </Link>
            ) : isAuthenticated ? (
              <button
                className="primary-button large"
                onClick={handleEnroll}
                disabled={enrolling}
              >
                {enrolling ? "Đang xử lý..." : (course.price ?? 0) > 0 ? "Thanh toán để học" : "Đăng ký học"}
              </button>
            ) : (
              <Link
                className="primary-button large"
                href={`/login?redirect=/courses/${courseId}`}
              >
                Đăng nhập để đăng ký
              </Link>
            )}
            {error && (
              <div className="form-error" style={{ marginTop: 12, maxWidth: 420 }}>
                {error}
              </div>
            )}
          </div>
        </div>

        <div className="course-detail-image">
          {!imgError ? (
            <img
              src={courseService.getCourseImageUrl(courseId)}
              alt={`Ảnh bìa khóa ${course.name}`}
              onError={() => setImgError(true)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                borderRadius: 28,
                border: "1px solid var(--border)",
                minHeight: 420,
              }}
            />
          ) : (
            <div className="course-image-fallback large-fallback">
              <span>{course.name?.charAt(0) || "K"}</span>
            </div>
          )}
        </div>
      </section>

      <section className="module-section">
        <div className="section-heading compact">
          <div>
            <span className="eyebrow">Nội dung</span>
            <h2>Bài học trong khóa</h2>
          </div>
          <span style={{ color: "var(--muted)" }}>{lessons.length} bài học</span>
        </div>
        {lessons.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>
            Khóa học này chưa có bài học.
          </div>
        ) : (
          <div className="module-list">
            {lessons.map((lesson, index) => (
              <div className="module-row" key={lesson.id}>
                <span className="module-index">{index + 1}</span>
                <div>
                  <strong>{lesson.title}</strong>
                  {lesson.durationMinutes && (
                    <small>{lesson.durationMinutes} phút</small>
                  )}
                </div>
                {enrollment && (
                  <Link
                    href={`/learn/${courseId}`}
                    className="ghost-button small-button"
                  >
                    Học
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );

  if (isAuthenticated) {
    return <StudentShell>{content}</StudentShell>;
  }
  return <PublicNav>{content}</PublicNav>;
}
