"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { StudentShell } from "@/components/StudentShell";
import { ErrorState } from "@/components/ErrorState";
import { useToast } from "@/components/Toast";
import { courseService } from "@/services/course.service";
import { learningService } from "@/services/learning.service";
import { quizService } from "@/services/quiz.service";
import type { Course, Lesson, Quiz } from "@/lib/types";
import { CheckCircle, PlayCircle, Lock, ChevronLeft, ChevronRight, ListChecks } from "lucide-react";

function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && "content" in data && Array.isArray((data as { content: unknown }).content))
    return (data as { content: T[] }).content;
  return [];
}

export default function LearnPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const toast = useToast();

  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completing, setCompleting] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [courseData, lessonData] = await Promise.all([
        courseService.getCourse(courseId),
        courseService.getLessonsByCourse(courseId),
      ]);
      setCourse(courseData);
      const lessonList = normalizeList<Lesson>(lessonData)
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
      setLessons(lessonList);
      if (lessonList.length > 0) {
        setCurrentLesson(lessonList[0]);
        setCurrentIndex(0);
        // Start first lesson
        learningService.startLesson(lessonList[0].id).catch(() => {});
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không tải được khóa học.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Load quizzes for current lesson
  useEffect(() => {
    if (currentLesson) {
      quizService.getQuizzes({ lessonId: currentLesson.id })
        .then((data) => setQuizzes(normalizeList<Quiz>(data)))
        .catch(() => setQuizzes([]));
    }
  }, [currentLesson]);

  const selectLesson = async (lesson: Lesson, index: number) => {
    setCurrentLesson(lesson);
    setCurrentIndex(index);
    try {
      await learningService.startLesson(lesson.id);
    } catch { /* ignore */ }
  };

  const completeLesson = async () => {
    if (!currentLesson) return;
    setCompleting(true);
    try {
      await learningService.completeLesson(currentLesson.id);
      setCompletedLessons((prev) => new Set(prev).add(currentLesson.id));
      toast.success(`Đã hoàn thành: ${currentLesson.title}`);
      // Auto-move to next lesson
      if (currentIndex < lessons.length - 1) {
        const next = lessons[currentIndex + 1];
        setCurrentLesson(next);
        setCurrentIndex(currentIndex + 1);
        learningService.startLesson(next.id).catch(() => {});
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Không thể hoàn thành bài học.");
    } finally {
      setCompleting(false);
    }
  };

  const goToLesson = (offset: number) => {
    const newIdx = currentIndex + offset;
    if (newIdx >= 0 && newIdx < lessons.length) {
      selectLesson(lessons[newIdx], newIdx);
    }
  };

  if (loading) {
    return (
      <AuthGate>
        <StudentShell>
          <div style={{ textAlign: "center", padding: 60, color: "var(--muted)" }}>
            Đang tải khóa học...
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

  return (
    <AuthGate>
      <StudentShell>
        <section className="lesson-layout">
          <div className="lesson-main">
            <Link href={`/courses/${courseId}`} className="back-link">
              ← Quay lại khóa học
            </Link>

            {currentLesson ? (
              <>
                <div className="lesson-player">
                  {currentLesson.videoUrl ? (
                    <video
                      key={currentLesson.id}
                      controls
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    >
                      <source src={currentLesson.videoUrl} />
                    </video>
                  ) : (
                    <>
                      <img
                        src={courseService.getCourseImageUrl(courseId)}
                        alt={`Bài học ${currentLesson.title}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={(e) => (e.currentTarget.style.display = "none")}
                      />
                    </>
                  )}
                </div>

                <div className="lesson-content">
                  <span className="eyebrow">{course?.name}</span>
                  <h1>{currentLesson.title}</h1>
                  {currentLesson.content && (
                    <div
                      className="lesson-text-content"
                      dangerouslySetInnerHTML={{ __html: currentLesson.content }}
                    />
                  )}
                  {currentLesson.description && !currentLesson.content && (
                    <p>{currentLesson.description}</p>
                  )}

                  {quizzes.length > 0 && (
                    <div className="quiz-reminder" style={{ marginTop: 18 }}>
                      <strong><ListChecks size={16} style={{ marginRight: 4 }} /> Quiz liên quan</strong>
                      {quizzes.map((q) => (
                        <div key={q.id} style={{ marginTop: 8 }}>
                          <Link href={`/quiz/${q.id}`} style={{ color: "var(--primary)", fontWeight: 800 }}>
                            {q.title} {q.requiredToComplete && "(bắt buộc)"}
                          </Link>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="lesson-actions">
                    <button
                      className="ghost-button"
                      onClick={() => goToLesson(-1)}
                      disabled={currentIndex === 0}
                    >
                      <ChevronLeft size={16} /> Bài trước
                    </button>
                    <button
                      className="primary-button"
                      onClick={completeLesson}
                      disabled={completing || completedLessons.has(currentLesson.id)}
                    >
                      {completedLessons.has(currentLesson.id)
                        ? "✓ Đã hoàn thành"
                        : completing
                        ? "Đang xử lý..."
                        : "Hoàn thành bài học"}
                    </button>
                    <button
                      className="ghost-button"
                      onClick={() => goToLesson(1)}
                      disabled={currentIndex === lessons.length - 1}
                    >
                      Bài tiếp <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}>
                Khóa học này chưa có bài học.
              </div>
            )}
          </div>

          <aside className="lesson-sidebar">
            <h2>Danh sách bài học</h2>
            <div className="lesson-list">
              {lessons.map((lesson, idx) => {
                const isActive = currentLesson?.id === lesson.id;
                const isCompleted = completedLessons.has(lesson.id);
                return (
                  <button
                    key={lesson.id}
                    className={`lesson-list-item ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`}
                    onClick={() => selectLesson(lesson, idx)}
                  >
                    <span className="lesson-list-index">
                      {isCompleted ? (
                        <CheckCircle size={18} />
                      ) : isActive ? (
                        <PlayCircle size={18} />
                      ) : (
                        <Lock size={16} />
                      )}
                    </span>
                    <div>
                      <strong>{lesson.title}</strong>
                      {lesson.durationMinutes && (
                        <small>{lesson.durationMinutes} phút</small>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>
        </section>
      </StudentShell>
    </AuthGate>
  );
}
