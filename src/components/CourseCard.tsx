"use client";
/* eslint-disable @next/next/no-img-element -- Course images are served by the LMS API. */

import Link from "next/link";
import { ProgressBar } from "./ProgressBar";
import type { Course, Enrollment } from "@/lib/types";
import { courseService } from "@/services/course.service";
import { useState } from "react";

interface CourseCardProps {
  course: Course;
  enrollment?: Enrollment | null;
}

export function CourseCard({ course, enrollment }: CourseCardProps) {
  const [imgError, setImgError] = useState(false);

  const imageUrl = courseService.getCourseImageUrl(course.id);
  const progress = enrollment?.progressPercent ?? 0;
  const isEnrolled = !!enrollment;

  const levelLabel: Record<string, string> = {
    BEGINNER: "Cơ bản",
    INTERMEDIATE: "Trung cấp",
    ADVANCED: "Nâng cao",
  };

  const priceText =
    course.price != null && course.price > 0
      ? `${course.price.toLocaleString("vi-VN")}đ`
      : "Miễn phí";

  return (
    <article className="course-card">
      <Link href={`/courses/${course.id}`} className="course-image-link" aria-label={`Xem khóa ${course.name}`}>
        {!imgError ? (
          <img
            src={imageUrl}
            alt={`Ảnh bìa khóa ${course.name}`}
            onError={() => setImgError(true)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div className="course-image-fallback">
            <span>{course.name?.charAt(0) || "K"}</span>
          </div>
        )}
      </Link>
      <div className="course-body">
        <div className="course-topline">
          <span className="course-category">{course.categoryName || course.category?.name || ""}</span>
          <span>{levelLabel[course.level || ""] || course.level || ""}</span>
        </div>
        <h3><Link href={`/courses/${course.id}`}>{course.name}</Link></h3>
        <p>{course.description || ""}</p>
        {isEnrolled && (
          <>
            <ProgressBar value={progress} label={`Tiến độ ${progress}%`} />
            <div className="course-meta">
              <span>{progress}% hoàn thành</span>
              <span className={`pill ${enrollment.status === "COMPLETED" ? "" : "pill"}`}>
                {enrollment.status === "COMPLETED" ? "Hoàn thành" : "Đang học"}
              </span>
            </div>
          </>
        )}
        <div className="course-footer">
          <span>{priceText}</span>
          {isEnrolled ? (
            <Link className="primary-button small-button" href={`/learn/${course.id}`}>
              {enrollment.status === "COMPLETED" ? "Xem lại" : "Tiếp tục"}
            </Link>
          ) : (
            <Link className="ghost-button small-button" href={`/courses/${course.id}`}>
              Xem chi tiết
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
