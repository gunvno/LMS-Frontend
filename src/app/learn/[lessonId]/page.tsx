"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { StudentShell } from "@/components/StudentShell";
import { courses, lessons } from "@/lib/student-data";

export default function LessonPage() {
  const params = useParams<{ lessonId: string }>();
  const lesson = lessons[params.lessonId as keyof typeof lessons] ?? lessons["feign-client-consul"];
  const course = courses.find((item) => item.id === lesson.courseId) ?? courses[0];

  return (
    <AuthGate>
      {(session) => (
        <StudentShell session={session}>
          <section className="lesson-layout">
            <div className="lesson-main">
              <Link href={`/courses/${course.id}`} className="back-link">← Quay lại khóa học</Link>
              <div className="lesson-player">
                <Image src={course.image} alt={`Video bài học ${lesson.title}`} width={1400} height={820} priority />
                <div className="play-overlay">▶</div>
              </div>
              <div className="lesson-content">
                <span className="eyebrow">{course.title}</span>
                <h1>{lesson.title}</h1>
                <p>{lesson.summary}</p>
                <div className="lesson-actions">
                  <button className="ghost-button">Đánh dấu cần xem lại</button>
                  <button className="primary-button">Hoàn thành bài học</button>
                </div>
              </div>
            </div>

            <aside className="lesson-sidebar">
              <h2>Nội dung bài học</h2>
              <div className="lesson-info">
                <span>Thời lượng</span>
                <strong>{lesson.duration}</strong>
              </div>
              <div className="resource-list">
                <strong>Tài nguyên</strong>
                {lesson.resources.map((resource) => <span key={resource}>{resource}</span>)}
              </div>
              <Link className="primary-button full-button" href="/quiz">Làm quiz liên quan</Link>
            </aside>
          </section>
        </StudentShell>
      )}
    </AuthGate>
  );
}
