"use client";
/* eslint-disable @next/next/no-img-element -- Lesson media can be authenticated or blob-backed. */

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { StudentShell } from "@/components/StudentShell";
import { ErrorState } from "@/components/ErrorState";
import { useToast } from "@/components/Toast";
import { courseService } from "@/services/course.service";
import { learningService } from "@/services/learning.service";
import { quizService } from "@/services/quiz.service";
import type { Course, Enrollment, Lesson, LessonResource, Quiz } from "@/lib/types";
import { CheckCircle, PlayCircle, Lock, ChevronLeft, ChevronRight, Download, ExternalLink, FileText, ListChecks } from "lucide-react";

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
  const [resources, setResources] = useState<LessonResource[]>([]);
  const [videoSource, setVideoSource] = useState("");
  const [videoLoading, setVideoLoading] = useState(false);
  const [videoError, setVideoError] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completing, setCompleting] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [courseCompleted, setCourseCompleted] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [courseData, lessonData, enrollmentData] = await Promise.all([
        courseService.getCourse(courseId),
        courseService.getLessonsByCourse(courseId),
        learningService.getMyCourses(),
      ]);
      setCourse(courseData);
      const lessonList = normalizeList<Lesson>(lessonData)
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
      const enrollment = normalizeList<Enrollment>(enrollmentData)
        .find((item) => item.courseId === courseId);
      const isCompleted = enrollment?.status === "COMPLETED";
      setCourseCompleted(isCompleted);
      setCompletedLessons(isCompleted
        ? new Set(lessonList.map((lesson) => lesson.id))
        : new Set());
      if (isCompleted) {
        learningService.completeCourse(courseId).catch(() => {});
      }
      setLessons(lessonList);
      if (lessonList.length > 0) {
        const firstAccessibleIndex = lessonList.findIndex((lesson) => !lesson.locked);
        const initialIndex = firstAccessibleIndex >= 0 ? firstAccessibleIndex : 0;
        const initialLesson = lessonList[initialIndex];
        setCurrentLesson(initialLesson);
        setCurrentIndex(initialIndex);
        // Start first lesson
        if (!initialLesson.locked) {
          learningService.startLesson(initialLesson.id).catch(() => {});
        }
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không tải được khóa học.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchData();
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchData]);

  // Load quizzes for current lesson
  useEffect(() => {
    if (currentLesson) {
      quizService.getQuizzes({ lessonId: currentLesson.id })
        .then((data) => setQuizzes(normalizeList<Quiz>(data)))
        .catch(() => setQuizzes([]));
      courseService.getLessonResources({ lessonId: currentLesson.id, page: 0, size: 100 })
        .then((data) => setResources(normalizeList<LessonResource>(data)))
        .catch(() => setResources([]));
    }
  }, [currentLesson]);

  useEffect(() => {
    let active = true;
    let objectUrl = "";
    const controller = new AbortController();

    const loadVideo = async () => {
      const source = currentLesson?.videoUrl;
      setVideoSource("");
      setVideoError("");
      if (!source) {
        setVideoLoading(false);
        return;
      }
      if (!source.startsWith("/course/api/")) {
        setVideoSource(source);
        setVideoLoading(false);
        return;
      }

      const resourceId = source.match(/lesson-resources\/([^/]+)\/view/)?.[1];
      if (!resourceId) {
        setVideoError("Đường dẫn video không hợp lệ.");
        setVideoLoading(false);
        return;
      }

      try {
        setVideoLoading(true);
        const blob = await courseService.viewLessonResource(resourceId, controller.signal);
        if (!active || controller.signal.aborted) return;
        if (blob.size === 0) {
          throw new Error("File video không có dữ liệu.");
        }
        objectUrl = URL.createObjectURL(blob);
        setVideoSource(objectUrl);
      } catch (videoLoadError) {
        if (!active || controller.signal.aborted || (videoLoadError instanceof DOMException && videoLoadError.name === "AbortError")) {
          return;
        }
        setVideoSource("");
        setVideoError(videoLoadError instanceof Error
          ? videoLoadError.message
          : "Không tải được video bài học.");
      } finally {
        if (active) setVideoLoading(false);
      }
    };

    void loadVideo();
    return () => {
      active = false;
      controller.abort();
      if (objectUrl) {
        window.setTimeout(() => URL.revokeObjectURL(objectUrl), 500);
      }
    };
  }, [currentLesson?.videoUrl]);

  const downloadResource = async (resource: LessonResource) => {
    try {
      const blob = await courseService.downloadLessonResource(resource.id);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = resource.title || "tai-lieu";
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không tải được tài liệu.");
    }
  };

  const selectLesson = async (lesson: Lesson, index: number) => {
    if (lesson.locked) {
      toast.info("Hãy hoàn thành bài học trước để mở khóa bài này.");
      return;
    }
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
      const refreshed = normalizeList<Lesson>(
        await courseService.getLessonsByCourse(courseId)
      ).sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
      setLessons(refreshed);
      const completedEnrollment = await learningService.completeCourse(courseId).catch(() => null);
      if (completedEnrollment?.status === "COMPLETED") {
        setCourseCompleted(true);
        setCompletedLessons(new Set(refreshed.map((lesson) => lesson.id)));
        toast.success("Bạn đã hoàn thành khóa học và được cấp chứng chỉ.");
      }
      // Auto-move to the newly unlocked next lesson.
      if (currentIndex < refreshed.length - 1) {
        const next = refreshed[currentIndex + 1];
        setCurrentLesson(next);
        setCurrentIndex(currentIndex + 1);
        if (!next.locked) {
          learningService.startLesson(next.id).catch(() => {});
        }
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

            {courseCompleted && (
              <div className="form-success" style={{ marginBottom: 16 }}>
                Bạn đã hoàn thành khóa học. Bạn vẫn có thể mở lại mọi bài học bất cứ lúc nào.
              </div>
            )}

            {currentLesson ? (
              <>
                <div className="lesson-player">
                  {videoLoading ? (
                    <div style={{ display: "grid", placeItems: "center", width: "100%", height: "100%" }}>Đang tải video...</div>
                  ) : videoSource ? (
                    <video
                      key={videoSource}
                      src={videoSource}
                      controls
                      playsInline
                      preload="metadata"
                      onCanPlay={() => setVideoError("")}
                      onError={(event) => {
                        const mediaError = event.currentTarget.error;
                        setVideoError(mediaError?.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
                          ? "Trình duyệt không hỗ trợ định dạng hoặc codec của video này. Hãy dùng MP4 (H.264) hoặc WebM."
                          : "Không thể phát video. Vui lòng tải lại hoặc kiểm tra file video.");
                      }}
                      style={{ width: "100%", height: "100%", objectFit: "contain" }}
                    />
                  ) : videoError ? (
                    <div style={{ display: "grid", placeItems: "center", width: "100%", height: "100%", padding: 24, textAlign: "center", color: "var(--danger)" }}>
                      {videoError}
                    </div>
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

                  {resources.some((resource) => resource.resourceType !== "VIDEO") && (
                    <div className="quiz-reminder" style={{ marginTop: 18 }}>
                      <strong><FileText size={16} style={{ marginRight: 4 }} /> Tài liệu bài học</strong>
                      {resources.filter((resource) => resource.resourceType !== "VIDEO").map((resource) => (
                        <div key={resource.id} style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                          <span>{resource.title}</span>
                          {resource.externalUrl ? (
                            <a href={resource.externalUrl} target="_blank" rel="noreferrer" className="ghost-button"><ExternalLink size={15} /> Mở</a>
                          ) : (
                            <button type="button" className="ghost-button" onClick={() => void downloadResource(resource)}><Download size={15} /> Tải xuống</button>
                          )}
                        </div>
                      ))}
                    </div>
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
                const isLocked = Boolean(lesson.locked);
                return (
                  <button
                    key={lesson.id}
                    className={`lesson-list-item ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""} ${isLocked ? "locked" : ""}`}
                    onClick={() => selectLesson(lesson, idx)}
                    disabled={isLocked}
                  >
                    <span className="lesson-list-index">
                      {isCompleted ? (
                        <CheckCircle size={18} />
                      ) : isLocked ? (
                        <Lock size={16} />
                      ) : isActive ? (
                        <PlayCircle size={18} />
                      ) : (
                        <PlayCircle size={16} />
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
