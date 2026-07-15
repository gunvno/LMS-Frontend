"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { StudentShell } from "@/components/StudentShell";
import { ErrorState } from "@/components/ErrorState";
import { useToast } from "@/components/Toast";
import { quizService } from "@/services/quiz.service";
import type { Quiz, Question, Answer, QuizAttempt, QuizAttemptHistory } from "@/lib/types";
import { formatDurationMinutes, formatViDateTime } from "@/lib/date-time";
import { CheckCircle2, Clock3, History, Target, Trophy, XCircle } from "lucide-react";

function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && "content" in data && Array.isArray((data as { content: unknown }).content))
    return (data as { content: T[] }).content;
  return [];
}

interface QuestionWithAnswers extends Question {
  answers: Answer[];
}

function formatScore(score: number) {
  return new Intl.NumberFormat("vi-VN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(score);
}

function AttemptHistory({ attempts }: { attempts: QuizAttemptHistory[] }) {
  const completedAttempts = attempts.flatMap((item, index) => {
    const score = Number(item.score);
    const submittedLabel = formatViDateTime(item.submittedAt);
    if (item.status !== "SUBMITTED"
      || !Number.isFinite(score)
      || typeof item.passed !== "boolean"
      || !submittedLabel) {
      return [];
    }
    const attemptNumber = Number(item.attemptNumber);
    return [{
      ...item,
      attemptNumber: Number.isFinite(attemptNumber) && attemptNumber > 0
        ? attemptNumber
        : attempts.length - index,
      score,
      submittedLabel,
      duration: formatDurationMinutes(item.startedAt, item.submittedAt),
    }];
  });
  const bestScore = completedAttempts.length > 0
    ? Math.max(...completedAttempts.map((item) => item.score))
    : 0;
  const passedAttempts = completedAttempts.filter((item) => item.passed).length;
  const latestAttempt = completedAttempts[0];

  return (
    <section className="quiz-attempt-history">
      <div className="quiz-attempt-history-heading">
        <div className="quiz-history-title">
          <span className="quiz-history-title-icon"><History size={22} /></span>
          <div>
            <span className="eyebrow">Kết quả của bạn</span>
            <h2>Lịch sử làm quiz</h2>
            <p>Xem lại điểm số của từng lần bạn đã hoàn thành và nộp bài.</p>
          </div>
        </div>
        <span className="quiz-history-count">{completedAttempts.length} lần đã nộp</span>
      </div>

      {completedAttempts.length === 0 ? (
        <div className="quiz-history-empty">
          <span><History size={28} /></span>
          <strong>Chưa có lịch sử làm bài</strong>
          <p>Kết quả sẽ xuất hiện tại đây sau khi bạn nộp quiz.</p>
        </div>
      ) : (
        <>
          <div className="quiz-history-summary">
            <article className="quiz-history-summary-card primary">
              <span><Trophy size={20} /></span>
              <div>
                <small>Điểm cao nhất</small>
                <strong>{formatScore(bestScore)}%</strong>
              </div>
            </article>
            <article className="quiz-history-summary-card success">
              <span><Target size={20} /></span>
              <div>
                <small>Số lần đạt</small>
                <strong>{passedAttempts}/{completedAttempts.length}</strong>
              </div>
            </article>
            <article className="quiz-history-summary-card neutral">
              <span><Clock3 size={20} /></span>
              <div>
                <small>Lần nộp gần nhất</small>
                <strong>{latestAttempt.submittedLabel}</strong>
              </div>
            </article>
          </div>

          <div className="quiz-history-list-heading">
            <strong>Chi tiết từng lần làm</strong>
            <span>Mới nhất trước</span>
          </div>
          <div className="quiz-history-list">
            {completedAttempts.map((item) => {
              return (
                <article className={`quiz-history-item ${item.passed ? "passed" : "failed"}`} key={item.id}>
                  <span className="quiz-history-number">{item.attemptNumber}</span>
                  <div className="quiz-history-attempt">
                    <div>
                      <strong>Lần làm thứ {item.attemptNumber}</strong>
                      <span className="quiz-history-submitted"><CheckCircle2 size={14} /> Đã nộp</span>
                    </div>
                    <span className="quiz-history-time">
                      <Clock3 size={15} /> Nộp lúc {item.submittedLabel}
                      {item.duration && <em>• Hoàn thành trong {item.duration}</em>}
                    </span>
                  </div>
                  <div className="quiz-history-score">
                    <span>Điểm số</span>
                    <strong>{formatScore(item.score)}%</strong>
                  </div>
                  <div className={`quiz-history-status ${item.passed ? "passed" : "failed"}`}>
                    {item.passed ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    <span>{item.passed ? "Đạt yêu cầu" : "Chưa đạt"}</span>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
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
  const [attemptHistory, setAttemptHistory] = useState<QuizAttemptHistory[]>([]);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const refreshAttemptHistory = useCallback(async () => {
    const history = await quizService.getAttemptHistory(quizId);
    setAttemptHistory(history);
  }, [quizId]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [quizData, history] = await Promise.all([
        quizService.getQuiz(quizId),
        quizService.getAttemptHistory(quizId),
      ]);
      setQuiz(quizData);
      setAttemptHistory(history);

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
            answers: answers.map((answer) => ({ ...answer, correct: undefined })),
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
    const timer = window.setTimeout(() => void fetchData(), 0);
    return () => window.clearTimeout(timer);
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
      void refreshAttemptHistory().catch(() => undefined);
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
                  <span>%</span>
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
            <AttemptHistory attempts={attemptHistory} />
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
                    {quiz?.passScore != null && ` Điểm đạt: ${quiz.passScore}%.`}
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
          <AttemptHistory attempts={attemptHistory} />
        </section>
      </StudentShell>
    </AuthGate>
  );
}
