"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { StudentShell } from "@/components/StudentShell";
import { CourseCard } from "@/components/CourseCard";
import { ErrorState } from "@/components/ErrorState";
import { useAuth } from "@/components/AuthProvider";
import { learningService } from "@/services/learning.service";
import { courseService } from "@/services/course.service";
import type { Course, Enrollment, Certificate } from "@/lib/types";
import { BookOpen, CheckCircle, Award, ListChecks } from "lucide-react";

function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && "content" in data && Array.isArray((data as { content: unknown }).content))
    return (data as { content: T[] }).content;
  return [];
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [courses, setCourses] = useState<Map<string, Course>>(new Map());
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [enrollData, certData] = await Promise.all([
        learningService.getMyCourses(),
        learningService.getMyCertificates().catch(() => []),
      ]);

      const enrollList = normalizeList<Enrollment>(enrollData);
      setEnrollments(enrollList);
      setCertificates(normalizeList<Certificate>(certData));

      // Fetch course details for enrollments
      const courseMap = new Map<string, Course>();
      await Promise.all(
        enrollList.map(async (e) => {
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

  const activeEnrollments = enrollments.filter((e) => e.status === "ACTIVE");
  const completedCount = enrollments.filter((e) => e.status === "COMPLETED").length;
  const displayName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username
    : "Học viên";

  return (
    <AuthGate>
      <StudentShell>
        <section className="dashboard-hero">
          <div>
            <span className="eyebrow">Tổng quan học tập</span>
            <h1>Chào {displayName}, hôm nay mình học tiếp nhé.</h1>
            <p>Xem tiến độ khóa học, hoàn thành bài tập và quiz để nhận chứng chỉ.</p>
          </div>
          {activeEnrollments.length > 0 && (
            <Link className="primary-button large" href={`/learn/${activeEnrollments[0].courseId}`}>
              Tiếp tục học
            </Link>
          )}
        </section>

        <section className="stats-row">
          <div className="stat-card">
            <span><BookOpen size={16} style={{ marginRight: 4 }} /> Khóa đang học</span>
            <strong>{activeEnrollments.length}</strong>
            <small>{enrollments.length} khóa đã đăng ký</small>
          </div>
          <div className="stat-card">
            <span><CheckCircle size={16} style={{ marginRight: 4 }} /> Đã hoàn thành</span>
            <strong>{completedCount}</strong>
            <small>khóa học</small>
          </div>
          <div className="stat-card">
            <span><ListChecks size={16} style={{ marginRight: 4 }} /> Quiz cần làm</span>
            <strong>—</strong>
            <small>Xem trong từng khóa</small>
          </div>
          <div className="stat-card">
            <span><Award size={16} style={{ marginRight: 4 }} /> Chứng chỉ</span>
            <strong>{certificates.length}</strong>
            <small>{certificates.length > 0 ? "đã được cấp" : "chưa có"}</small>
          </div>
        </section>

        {error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
            Đang tải dữ liệu...
          </div>
        ) : (
          <section className="app-two-columns">
            <div className="app-section">
              <div className="section-heading compact">
                <div>
                  <span className="eyebrow">Đang học</span>
                  <h2>Khóa học của tôi</h2>
                </div>
                <Link href="/my-courses">Xem tất cả</Link>
              </div>
              {activeEnrollments.length === 0 ? (
                <div style={{ padding: 20, color: "var(--muted)", textAlign: "center" }}>
                  Bạn chưa đăng ký khóa học nào.{" "}
                  <Link href="/courses" style={{ color: "var(--primary)", fontWeight: 800 }}>
                    Xem khóa học
                  </Link>
                </div>
              ) : (
                <div className="course-grid dashboard-course-grid">
                  {activeEnrollments.slice(0, 2).map((enrollment) => {
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
                </div>
              )}
            </div>

            <aside className="app-section">
              <div className="section-heading compact">
                <div>
                  <span className="eyebrow">Thành tích</span>
                  <h2>Chứng chỉ</h2>
                </div>
                <Link href="/certificates">Xem tất cả</Link>
              </div>
              {certificates.length === 0 ? (
                <div style={{ padding: 20, color: "var(--muted)", textAlign: "center" }}>
                  Hoàn thành khóa học để nhận chứng chỉ.
                </div>
              ) : (
                <div className="timeline-list">
                  {certificates.slice(0, 3).map((cert) => (
                    <div className="timeline-item" key={cert.id || cert.certificateCode}>
                      <time><Award size={18} /></time>
                      <div>
                        <strong>{cert.courseName || "Chứng chỉ"}</strong>
                        <span>Mã: {cert.certificateCode}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </aside>
          </section>
        )}
      </StudentShell>
    </AuthGate>
  );
}
