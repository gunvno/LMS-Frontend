/* ──────────────────────────────────────────────────────────
   LMS Mini — Quiz Service
   ────────────────────────────────────────────────────────── */

import { api, toQuery, wrap } from "@/lib/api-client";
import type {
  Quiz,
  Question,
  Answer,
  QuizAttempt,
  QuizAttemptHistory,
  QuizSubmitAnswer,
  PageData,
} from "@/lib/types";

export const quizService = {
  /** Lấy danh sách quiz */
  getQuizzes: (params: Record<string, unknown> = {}) =>
    api.get<PageData<Quiz> | Quiz[]>(
      `/quiz/api/v1/quiz?${toQuery({ page: 0, size: 50, ...params })}`
    ),

  /** Chi tiết quiz */
  getQuiz: (id: string) =>
    api.get<Quiz>(`/quiz/api/v1/quiz/${id}`),

  /** Lấy câu hỏi theo quiz */
  getQuestions: (quizId: string) =>
    api.get<PageData<Question> | Question[]>(
      `/quiz/api/v1/questions?${toQuery({ quizId, page: 0, size: 100 })}`
    ),

  /** Lấy đáp án theo câu hỏi */
  getAnswers: (questionId: string) =>
    api.get<PageData<Answer> | Answer[]>(
      `/quiz/api/v1/answers?${toQuery({ questionId, page: 0, size: 100 })}`
    ),

  /** Bắt đầu quiz attempt */
  startAttempt: (quizId: string) =>
    api.post<QuizAttempt>(
      `/quiz/api/v1/quizzes/${quizId}/attempts`,
      wrap({})
    ),

  /** Lịch sử điểm các lần làm quiz của user hiện tại */
  getAttemptHistory: (quizId: string) =>
    api.get<QuizAttemptHistory[]>(
      `/quiz/api/v1/quizzes/${quizId}/attempts/me`
    ),

  /** Nộp bài quiz */
  submitAttempt: (attemptId: string, answers: QuizSubmitAnswer[]) =>
    api.post<QuizAttempt>(
      `/quiz/api/v1/quiz-attempts/${attemptId}/submit`,
      wrap({ answers })
    ),
};
