"use client";

import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { CourseCard } from "@/components/CourseCard";
import { StudentShell } from "@/components/StudentShell";
import { courses, learningPlan, quizzes, studentStats } from "@/lib/student-data";

export default function DashboardPage() {
  return (
    <AuthGate>
      {(session) => (
        <StudentShell session={session}>
          <section className="dashboard-hero">
            <div>
              <span className="eyebrow">Tổng quan học tập</span>
              <h1>Chào {session.name}, hôm nay mình học tiếp nhé.</h1>
              <p>Bài học gần nhất đang ở module giao tiếp microservices. Hoàn thành quiz bắt buộc để mở chứng chỉ cuối khóa.</p>
            </div>
            <Link className="primary-button large" href="/learn/feign-client-consul">Tiếp tục học</Link>
          </section>

          <section className="stats-row">
            {studentStats.map((stat) => (
              <div className="stat-card" key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
                <small>{stat.note}</small>
              </div>
            ))}
          </section>

          <section className="app-two-columns">
            <div className="app-section">
              <div className="section-heading compact">
                <div>
                  <span className="eyebrow">Đang học</span>
                  <h2>Khóa học của tôi</h2>
                </div>
                <Link href="/courses">Xem tất cả</Link>
              </div>
              <div className="course-grid dashboard-course-grid">
                {courses.slice(0, 2).map((course) => <CourseCard course={course} key={course.id} />)}
              </div>
            </div>

            <aside className="app-section">
              <div className="section-heading compact">
                <div>
                  <span className="eyebrow">Hôm nay</span>
                  <h2>Kế hoạch</h2>
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
              <div className="quiz-reminder">
                <strong>Quiz cần hoàn thành</strong>
                <span>{quizzes.filter((quiz) => quiz.status !== "Đã đạt").length} quiz đang chờ</span>
                <Link href="/quiz">Vào làm quiz</Link>
              </div>
            </aside>
          </section>
        </StudentShell>
      )}
    </AuthGate>
  );
}
