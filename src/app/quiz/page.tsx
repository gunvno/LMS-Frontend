"use client";

import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { StudentShell } from "@/components/StudentShell";
import { quizzes } from "@/lib/student-data";

export default function QuizPage() {
  return (
    <AuthGate>
      {(session) => (
        <StudentShell session={session}>
          <section className="page-heading">
            <div>
              <span className="eyebrow">Quiz</span>
              <h1>Bài kiểm tra của tôi</h1>
              <p>Hoàn thành quiz bắt buộc để đủ điều kiện kết thúc khóa và sinh chứng chỉ.</p>
            </div>
          </section>

          <section className="quiz-grid">
            {quizzes.map((quiz) => (
              <article className="quiz-card" key={quiz.id}>
                <div>
                  <span className={quiz.required ? "pill danger" : "pill"}>{quiz.required ? "Bắt buộc" : "Tự luyện"}</span>
                  <h2>{quiz.title}</h2>
                  <p>{quiz.course}</p>
                </div>
                <div className="quiz-meta">
                  <span>{quiz.questions} câu hỏi</span>
                  <span>{quiz.duration}</span>
                  <span>{quiz.score ? `Điểm ${quiz.score}` : quiz.status}</span>
                </div>
                <Link className="primary-button full-button" href={`/quiz/${quiz.id}`}>{quiz.score ? "Xem kết quả" : "Bắt đầu"}</Link>
              </article>
            ))}
          </section>
        </StudentShell>
      )}
    </AuthGate>
  );
}
