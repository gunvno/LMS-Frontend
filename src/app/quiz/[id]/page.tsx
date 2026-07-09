"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { StudentShell } from "@/components/StudentShell";
import { quizzes } from "@/lib/student-data";

const questions = [
  {
    title: "Feign Client dùng service name để làm gì?",
    answers: ["Gọi service qua Consul/load balancer", "Tạo bảng trong database", "Render giao diện React", "Sinh mã chứng chỉ"],
  },
  {
    title: "API internal nên dùng cho trường hợp nào?",
    answers: ["Giao tiếp giữa các service", "Form đăng nhập public", "Trang marketing", "Upload ảnh từ trình duyệt"],
  },
];

export default function QuizDetailPage() {
  const params = useParams<{ id: string }>();
  const quiz = quizzes.find((item) => item.id === params.id) ?? quizzes[0];

  return (
    <AuthGate>
      {(session) => (
        <StudentShell session={session}>
          <section className="quiz-taking">
            <div className="quiz-header">
              <Link href="/quiz" className="back-link">← Quay lại quiz</Link>
              <span className="eyebrow">{quiz.course}</span>
              <h1>{quiz.title}</h1>
              <p>{quiz.questions} câu hỏi - {quiz.duration}</p>
            </div>
            <div className="quiz-question-list">
              {questions.map((question, index) => (
                <article className="quiz-question" key={question.title}>
                  <strong>Câu {index + 1}. {question.title}</strong>
                  <div className="answer-list">
                    {question.answers.map((answer) => (
                      <label key={answer}>
                        <input type="radio" name={`question-${index}`} />
                        <span>{answer}</span>
                      </label>
                    ))}
                  </div>
                </article>
              ))}
            </div>
            <div className="submit-bar">
              <span>Đã trả lời 0/{questions.length} câu</span>
              <button className="primary-button">Nộp bài</button>
            </div>
          </section>
        </StudentShell>
      )}
    </AuthGate>
  );
}
