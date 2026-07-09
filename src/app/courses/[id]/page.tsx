"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { ProgressBar } from "@/components/ProgressBar";
import { StudentShell } from "@/components/StudentShell";
import { courses } from "@/lib/student-data";

export default function CourseDetailPage() {
  const params = useParams<{ id: string }>();
  const course = courses.find((item) => item.id === params.id) ?? courses[0];

  return (
    <AuthGate>
      {(session) => (
        <StudentShell session={session}>
          <section className="course-detail-hero">
            <div className="course-detail-copy">
              <Link href="/courses" className="back-link">← Quay lại khóa học</Link>
              <span className="eyebrow">{course.category}</span>
              <h1>{course.title}</h1>
              <p>{course.description}</p>
              <div className="detail-meta">
                <span>Mã khóa: {course.code}</span>
                <span>Giảng viên: {course.instructor}</span>
                <span>Cấp độ: {course.level}</span>
              </div>
              <ProgressBar value={course.progress} />
              <div className="course-meta">
                <span>{course.lessonsCompleted}/{course.lessonsTotal} bài đã học</span>
                <strong>{course.progress}%</strong>
              </div>
              <Link className="primary-button large" href={`/learn/${course.nextLessonId}`}>Tiếp tục học</Link>
            </div>
            <Image src={course.image} alt={`Ảnh bìa khóa ${course.title}`} width={1200} height={800} priority />
          </section>

          <section className="module-section">
            <div className="section-heading compact">
              <div>
                <span className="eyebrow">Nội dung</span>
                <h2>Module trong khóa học</h2>
              </div>
            </div>
            <div className="module-list">
              {course.modules.map((module, index) => (
                <div className="module-row" key={module.id}>
                  <span className="module-index">{index + 1}</span>
                  <div>
                    <strong>{module.title}</strong>
                    <small>{module.duration}</small>
                  </div>
                  <span className={`status-badge ${module.status.toLowerCase()}`}>
                    {module.status === "DONE" ? "Hoàn thành" : module.status === "IN_PROGRESS" ? "Đang học" : "Đang khóa"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </StudentShell>
      )}
    </AuthGate>
  );
}
