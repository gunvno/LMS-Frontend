import Image from "next/image";
import Link from "next/link";
import { CourseCard } from "@/components/CourseCard";
import { courses, learningPlan, studentStats } from "@/lib/student-data";

export default function Home() {
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
          <a href="#plan">Lịch học</a>
          <a href="#certificates">Chứng chỉ</a>
          <a href="#support">Hỗ trợ</a>
        </nav>
        <div className="student-actions">
          <Link className="ghost-button" href="/login">Đăng nhập</Link>
          <Link className="primary-button" href="/dashboard">Vào lớp học</Link>
        </div>
      </header>

      <section id="top" className="hero-grid">
        <div className="hero-copy">
          <div className="eyebrow">Xin chào, học viên</div>
          <h1>Học tiếp nội dung đang dở, theo dõi tiến độ và sẵn sàng cho bài quiz tiếp theo.</h1>
          <p>
            Giao diện học tập tập trung vào việc học thật: bài đang học, tiến độ khóa học,
            deadline quiz và chứng chỉ sắp đạt được.
          </p>
          <div className="hero-actions">
            <Link className="primary-button large" href="/login">Bắt đầu học</Link>
            <Link className="ghost-button large" href="/courses">Xem khóa học</Link>
          </div>
        </div>

        <aside className="continue-card" aria-label="Tiếp tục học">
          <div className="continue-media">
            <Image
              src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1000&q=80"
              alt="Không gian học lập trình với laptop"
              width={1000}
              height={650}
              priority
            />
          </div>
          <div className="continue-body">
            <span className="pill">Đang học</span>
            <h2>Feign Client giữa Learning Service và Course Service</h2>
            <p>Module 4 - Giao tiếp Microservices</p>
            <div className="progress-line" aria-label="Tiến độ khóa học 68 phần trăm">
              <span style={{ width: "68%" }} />
            </div>
            <div className="continue-footer">
              <span>68% hoàn thành</span>
              <strong>18 phút còn lại</strong>
            </div>
          </div>
        </aside>
      </section>

      <section className="stats-row" aria-label="Tổng quan học tập">
        {studentStats.map((stat) => (
          <div className="stat-card" key={stat.label}>
            <span>{stat.label}</span>
            <strong>{stat.value}</strong>
            <small>{stat.note}</small>
          </div>
        ))}
      </section>

      <section id="courses" className="content-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Đang học</span>
            <h2>Khóa học nổi bật</h2>
          </div>
          <Link href="/courses">Xem tất cả</Link>
        </div>
        <div className="course-grid">
          {courses.map((course) => <CourseCard course={course} key={course.id} />)}
        </div>
      </section>

      <section id="plan" className="two-column-section">
        <div className="panel-card">
          <div className="section-heading compact">
            <div>
              <span className="eyebrow">Hôm nay</span>
              <h2>Kế hoạch học tập</h2>
            </div>
          </div>
          <div className="timeline-list">
            {learningPlan.map((item) => (
              <div className="timeline-item" key={item.title}>
                <time>{item.time}</time>
                <div>
                  <strong>{item.title}</strong>
                  <span>{item.type} - {item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div id="certificates" className="panel-card certificate-card">
          <span className="eyebrow">Chứng chỉ</span>
          <h2>Backend Foundation</h2>
          <p>Đã hoàn thành 100% bài học và đạt quiz bắt buộc. Chứng chỉ có hiệu lực đến 08/07/2028.</p>
          <div className="certificate-code">LMS-2026-A91F3C7B</div>
          <Link className="primary-button" href="/certificates">Xem chứng chỉ</Link>
        </div>
      </section>

      <footer id="support" className="student-footer">
        <span>EduFlow LMS</span>
        <p>Cần hỗ trợ? Liên hệ mentor hoặc trung tâm hỗ trợ học viên.</p>
      </footer>
    </main>
  );
}
