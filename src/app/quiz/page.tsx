"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { StudentShell } from "@/components/StudentShell";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { learningService } from "@/services/learning.service";
import { quizService } from "@/services/quiz.service";
import type { Enrollment, Quiz } from "@/lib/types";
import { ListChecks } from "lucide-react";

function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && "content" in data && Array.isArray((data as { content: unknown }).content))
    return (data as { content: T[] }).content;
  return [];
}

export default function QuizListPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const myCoursesData = await learningService.getMyCourses();
      const enrollments = normalizeList<Enrollment>(myCoursesData);
      const enrolledCourseIds = new Set(
        enrollments.map((enrollment) => enrollment.courseId).filter(Boolean)
      );

      if (enrolledCourseIds.size === 0) {
        setQuizzes([]);
        return;
      }

      const data = await quizService.getQuizzes();
      const allQuizzes = normalizeList<Quiz>(data);
      setQuizzes(allQuizzes.filter((quiz) => quiz.courseId && enrolledCourseIds.has(quiz.courseId)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách quiz.");
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
            <span className="eyebrow">Quiz</span>
            <h1>Bài kiểm tra</h1>
            <p>Hoàn thành quiz bắt buộc để đủ điều kiện kết thúc khóa và sinh chứng chỉ.</p>
          </div>
        </section>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
            Đang tải danh sách quiz...
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : quizzes.length === 0 ? (
          <EmptyState
            title="Chưa có quiz nào"
            description="Quiz sẽ hiển thị khi bạn đăng ký khóa học có quiz."
            icon={<ListChecks size={48} />}
          />
        ) : (
          <section className="quiz-grid">
            {quizzes.map((quiz) => (
              <article className="quiz-card" key={quiz.id}>
                <div>
                  <span className={quiz.requiredToComplete ? "pill danger" : "pill"}>
                    {quiz.requiredToComplete ? "Bắt buộc" : "Tự luyện"}
                  </span>
                  <h2>{quiz.title}</h2>
                  {quiz.description && <p>{quiz.description}</p>}
                </div>
                <div className="quiz-meta">
                  {quiz.questionCount != null && <span>{quiz.questionCount} câu hỏi</span>}
                  {quiz.durationMinutes != null && <span>{quiz.durationMinutes} phút</span>}
                  {quiz.passScore != null && <span>Điểm đạt: {quiz.passScore}%</span>}
                </div>
                <Link className="primary-button full-button" href={`/quiz/${quiz.id}`}>
                  Bắt đầu
                </Link>
              </article>
            ))}
          </section>
        )}
      </StudentShell>
    </AuthGate>
  );
}
