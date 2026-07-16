"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CourseCard } from "@/components/CourseCard";
import { courseService } from "@/services/course.service";
import { learningService } from "@/services/learning.service";
import type { Course, Certificate } from "@/lib/types";
import { useToast } from "@/components/Toast";
import { useAuth } from "@/components/AuthProvider";
import { BookOpen, Award, TrendingUp, ListChecks, Search } from "lucide-react";
import { validateCertificateCode } from "@/lib/form-validation";

function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && "content" in data && Array.isArray((data as { content: unknown }).content))
    return (data as { content: T[] }).content;
  return [];
}

export default function Home() {
  const toast = useToast();
  const { isAuthenticated, isLoading, user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyResult, setVerifyResult] = useState<Certificate | null>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    courseService.getCourses({ page: 0, size: 6 })
      .then((data) => {
        const list = normalizeList<Course>(data);
        setCourses(list.filter((c) => !c.status || c.status === "PUBLISHED").slice(0, 6));
      })
      .catch(() => {});
  }, []);

  const verifyCertificate = async () => {
    const validationError = validateCertificateCode(verifyCode);
    if (validationError) {
      toast.error(validationError);
      return;
    }
    setVerifying(true);
    setVerifyResult(null);
    try {
      const result = await learningService.verifyCertificate(verifyCode.trim());
      setVerifyResult(result);
    } catch {
      toast.error("Không tìm thấy chứng chỉ với mã này.");
    } finally {
      setVerifying(false);
    }
  };

  const displayName = user
    ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.username || user.email
    : "Học viên";

  return (
    <main className="student-shell">
      <header className="student-nav">
        <Link className="student-brand" href="/" aria-label="EduFlow trang chủ">
          <span className="brand-symbol">E</span>
          <span>
            <strong>EduFlow</strong>
            <small>Cổng học viên</small>
          </span>
        </Link>
        <nav className="nav-links" aria-label="Điều hướng trang chủ">
          <a href="#courses">Khóa học</a>
          <a href="#benefits">Tính năng</a>
          <a href="#certificates">Chứng chỉ</a>
        </nav>
        <div className="student-actions">
          {!isLoading && isAuthenticated ? (
            <>
              <Link className="ghost-button" href="/dashboard">{displayName}</Link>
              <Link className="primary-button" href="/dashboard">Vào học</Link>
            </>
          ) : (
            <>
              <Link className="ghost-button" href="/login">Đăng nhập</Link>
              <Link className="primary-button" href="/register">Đăng ký</Link>
            </>
          )}
        </div>
      </header>

      <section id="top" className="hero-grid">
        <div className="hero-copy">
          <div className="eyebrow">Nền tảng học tập</div>
          <h1>Học kỹ năng mới, theo dõi tiến độ và nhận chứng chỉ.</h1>
          <p>
            EduFlow giúp bạn tiếp cận khóa học chất lượng, hoàn thành bài tập thực hành,
            quiz kiểm tra và nhận chứng chỉ khi đủ điều kiện.
          </p>
          <div className="hero-actions">
            <Link className="primary-button large" href={isAuthenticated ? "/dashboard" : "/register"}>
              {isAuthenticated ? "Vào học tiếp" : "Bắt đầu học"}
            </Link>
            <Link className="ghost-button large" href="/courses">Xem khóa học</Link>
          </div>
        </div>

        <aside className="continue-card" aria-label="Giới thiệu">
          <div className="continue-body" style={{ padding: 28 }}>
            <span className="pill">Miễn phí</span>
            <h2 style={{ marginTop: 16 }}>Đăng ký và bắt đầu học ngay</h2>
            <p>Truy cập khóa học, bài giảng video, quiz và chứng chỉ hoàn toàn miễn phí.</p>
            <div style={{ display: "grid", gap: 12, marginTop: 20 }}>
              <span className="login-benefits-item">
                <BookOpen size={18} /> Khóa học chất lượng
              </span>
              <span className="login-benefits-item">
                <ListChecks size={18} /> Quiz kiểm tra kiến thức
              </span>
              <span className="login-benefits-item">
                <Award size={18} /> Chứng chỉ hoàn thành
              </span>
              <span className="login-benefits-item">
                <TrendingUp size={18} /> Theo dõi tiến độ
              </span>
            </div>
          </div>
        </aside>
      </section>

      {courses.length > 0 && (
        <section id="courses" className="content-section">
          <div className="section-heading">
            <div>
              <span className="eyebrow">Khóa học</span>
              <h2>Khóa học nổi bật</h2>
            </div>
            <Link href="/courses">Xem tất cả</Link>
          </div>
          <div className="course-grid">
            {courses.map((course) => <CourseCard course={course} key={course.id} />)}
          </div>
        </section>
      )}

      <section id="benefits" className="two-column-section" style={{ marginTop: 40 }}>
        <div className="panel-card">
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">Tại sao chọn EduFlow</span>
              <h2>Tính năng nổi bật</h2>
            </div>
          </div>
          <div className="timeline-list">
            <div className="timeline-item">
              <time><BookOpen size={18} /></time>
              <div>
                <strong>Bài học có cấu trúc</strong>
                <span>Nội dung được chia thành bài học ngắn, dễ theo dõi</span>
              </div>
            </div>
            <div className="timeline-item">
              <time><TrendingUp size={18} /></time>
              <div>
                <strong>Theo dõi tiến độ</strong>
                <span>Xem tiến độ hoàn thành từng khóa học</span>
              </div>
            </div>
            <div className="timeline-item">
              <time><ListChecks size={18} /></time>
              <div>
                <strong>Quiz kiểm tra</strong>
                <span>Đánh giá kiến thức qua quiz trắc nghiệm</span>
              </div>
            </div>
            <div className="timeline-item">
              <time><Award size={18} /></time>
              <div>
                <strong>Chứng chỉ hoàn thành</strong>
                <span>Nhận chứng chỉ khi đạt đủ điều kiện</span>
              </div>
            </div>
          </div>
        </div>

        <div id="certificates" className="panel-card">
          <span className="eyebrow">Chứng chỉ</span>
          <h2>Tra cứu chứng chỉ</h2>
          <p>Nhập mã chứng chỉ để xác minh tình trạng hiệu lực.</p>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <input
              value={verifyCode}
              onChange={(e) => setVerifyCode(e.target.value.toUpperCase())}
              placeholder="Nhập mã chứng chỉ..."
              maxLength={17}
              autoCapitalize="characters"
              spellCheck={false}
              aria-label="Mã chứng chỉ"
              onKeyDown={(e) => {
                if (e.key === "Enter") void verifyCertificate();
              }}
              style={{ flex: 1 }}
            />
            <button
              className="primary-button"
              onClick={verifyCertificate}
              disabled={verifying || !verifyCode.trim()}
            >
              <Search size={18} />
            </button>
          </div>
          {verifyResult && (
            <div className="verify-result" style={{ marginTop: 14 }}>
              <strong>{verifyResult.courseName || "Chứng chỉ"}</strong>
              <span>Mã: {verifyResult.certificateCode}</span>
              <span style={{ color: "var(--success)", fontWeight: 800 }}>
                {verifyResult.status === "ISSUED" ? "Đã cấp" : verifyResult.status}
              </span>
            </div>
          )}
        </div>
      </section>

      <footer className="student-footer">
        <span>EduFlow LMS</span>
        <p>Cần hỗ trợ? Liên hệ mentor hoặc trung tâm hỗ trợ học viên.</p>
      </footer>
    </main>
  );
}
