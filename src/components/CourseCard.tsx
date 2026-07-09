import Image from "next/image";
import Link from "next/link";
import type { Course } from "@/lib/student-data";
import { ProgressBar } from "./ProgressBar";

type CourseCardProps = {
  course: Course;
};

export function CourseCard({ course }: CourseCardProps) {
  return (
    <article className="course-card">
      <Link href={`/courses/${course.id}`} className="course-image-link" aria-label={`Xem khóa ${course.title}`}>
        <Image src={course.image} alt={`Ảnh bìa khóa ${course.title}`} width={1200} height={720} />
      </Link>
      <div className="course-body">
        <div className="course-topline">
          <span className="course-category">{course.category}</span>
          <span>{course.level}</span>
        </div>
        <h3><Link href={`/courses/${course.id}`}>{course.title}</Link></h3>
        <p>{course.description}</p>
        <ProgressBar value={course.progress} label={`Tiến độ khóa ${course.title} ${course.progress}%`} />
        <div className="course-meta">
          <span>{course.lessonsCompleted}/{course.lessonsTotal} bài học</span>
          <strong>{course.progress}%</strong>
        </div>
        <div className="course-footer">
          <span>{course.duration}</span>
          <Link className="primary-button small-button" href={`/learn/${course.nextLessonId}`}>Tiếp tục</Link>
        </div>
      </div>
    </article>
  );
}
