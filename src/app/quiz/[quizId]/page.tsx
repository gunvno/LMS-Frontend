"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { StudentShell } from "@/components/StudentShell";
import { ErrorState } from "@/components/ErrorState";
import { useToast } from "@/components/Toast";
import { quizService } from "@/services/quiz.service";
import type { Quiz, Question, Answer, QuizAttempt } from "@/lib/types";

function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && "content" in data && Array.isArray((data as { content: unknown }).content))
    return (data as { content: T[] }).content;
  return [];
}

interface QuestionWithAnswers extends Question {
  answers: Answer[];
}

export default function QuizAttemptPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const { quizId } = use(params);
  const toast = useToast();

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuestionWithAnswers[]>([]);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const quizData = await quizService.getQuiz(quizId);
      setQuiz(quizData);

      const questionData = await quizService.getQuestions(quizId);
      const questionList = normalizeList<Question>(questionData);

      // Load answers for each question
      const questionsWithAnswers: QuestionWithAnswers[] = await Promise.all(
        questionList.map(async (q) => {
          const answerData = await quizService.getAnswers(q.id);
          const answers = normalizeList<Answer>(answerData);
          return {
            ...q,
            // ⚠️ Strip `correct` field for security
            answers: answers.map(({ correct, ...rest }) => ({ ...rest, correct: undefined })) as Answer[],
          };
        })
      );

      setQuestions(questionsWithAnswers.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không tải được quiz.");
    } finally {
      setLoading(false);
    }
  }, [quizId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const startAttempt = async () => {
    try {
      const attemptData = await quizService.startAttempt(quizId);
      setAttempt(attemptData);
      setSelectedAnswers({});
      setResult(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Không bắt đầu được quiz.");
    }
  };

  const selectAnswer = (questionId: string, answerId: string) => {
    setSelectedAnswers((prev) => ({ ...prev, [questionId]: answerId }));
  };

  const submitAttempt = async () => {
    if (!attempt) return;

    const answers = Object.entries(selectedAnswers).map(([questionId, answerId]) => ({
      questionId,
      answerId,
    }));

    setSubmitting(true);
    try {
      const resultData = await quizService.submitAttempt(attempt.id, answers);
      setResult(resultData);
      if (resultData.passed) {
        toast.success("Chúc mừng! Bạn đã đạt quiz.");
      } else {
        toast.info("Bạn chưa đạt. Hãy thử lại.");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Không nộp được bài quiz.");
    } finally {
      setSubmitting(false);
    }
  };

  const answeredCount = Object.keys(selectedAnswers).length;

  if (loading) {
    return (
      <AuthGate>
        <StudentShell>
          <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>
            Đang tải quiz...
          </div>
        </StudentShell>
      </AuthGate>
    );
  }

  if (error) {
    return (
      <AuthGate>
        <StudentShell>
          <ErrorState message={error} onRetry={fetchData} />
        </StudentShell>
      </AuthGate>
    );
  }

  // Result view
  if (result) {
    return (
      <AuthGate>
        <StudentShell>
          <section className="quiz-taking">
            <div className="quiz-header">
              <Link href="/quiz" className="back-link">← Quay lại danh sách quiz</Link>
              <h1>{quiz?.title}</h1>
            </div>
            <div className={`quiz-result ${result.passed ? "result-pass" : "result-fail"}`}>
              <div className="result-icon">{result.passed ? "🎉" : "😔"}</div>
              <h2>{result.passed ? "Chúc mừng! Bạn đã đạt" : "Chưa đạt"}</h2>
              {result.score != null && (
                <div className="result-score">
                  <strong>{result.score}</strong>
                  <span>điểm</span>
                </div>
              )}
              {result.correctAnswers != null && result.totalQuestions != null && (
                <p>Đúng {result.correctAnswers}/{result.totalQuestions} câu</p>
              )}
              <div className="result-actions">
                {!result.passed && (
                  <button className="primary-button" onClick={startAttempt}>
                    Làm lại
                  </button>
                )}
                <Link className="ghost-button" href="/quiz">
                  Về danh sách quiz
                </Link>
              </div>
            </div>
          </section>
        </StudentShell>
      </AuthGate>
    );
  }

  return (
    <AuthGate>
      <StudentShell>
        <section className="quiz-taking">
          <div className="quiz-header">
            <Link href="/quiz" className="back-link">← Quay lại quiz</Link>
            <span className="eyebrow">{quiz?.requiredToComplete ? "Bắt buộc" : "Tự luyện"}</span>
            <h1>{quiz?.title}</h1>
            <p>
              {questions.length} câu hỏi
              {quiz?.durationMinutes ? ` — ${quiz.durationMinutes} phút` : ""}
            </p>
          </div>

          {!attempt ? (
            // Not started
            <div style={{ textAlign: "center", padding: 40 }}>
              {questions.length === 0 ? (
                <div style={{ color: "var(--muted)" }}>
                  Quiz này chưa có câu hỏi.
                </div>
              ) : (
                <>
                  <p style={{ color: "var(--muted)", marginBottom: 20 }}>
                    Bấm bắt đầu khi bạn đã sẵn sàng.
                    {quiz?.passingScore != null && ` Điểm đạt: ${quiz.passingScore}.`}
                  </p>
                  <button className="primary-button large" onClick={startAttempt}>
                    Bắt đầu quiz
                  </button>
                </>
              )}
            </div>
          ) : (
            // In progress
            <>
              <div className="quiz-question-list">
                {questions.map((question, qIdx) => (
                  <article className="quiz-question" key={question.id}>
                    <strong>Câu {qIdx + 1}. {question.content}</strong>
                    <div className="answer-list">
                      {question.answers.map((answer) => (
                        <label
                          key={answer.id}
                          className={selectedAnswers[question.id] === answer.id ? "selected" : ""}
                        >
                          <input
                            type="radio"
                            name={`q-${question.id}`}
                            checked={selectedAnswers[question.id] === answer.id}
                            onChange={() => selectAnswer(question.id, answer.id)}
                            disabled={submitting}
                          />
                          <span>{answer.content}</span>
                        </label>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
              <div className="submit-bar">
                <span>Đã trả lời {answeredCount}/{questions.length} câu</span>
                <button
                  className="primary-button"
                  onClick={submitAttempt}
                  disabled={submitting || answeredCount === 0}
                >
                  {submitting ? "Đang nộp bài..." : "Nộp bài"}
                </button>
              </div>
            </>
          )}
        </section>
      </StudentShell>
    </AuthGate>
  );
}
