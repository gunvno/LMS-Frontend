"use client";

import { useMemo, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { CourseCard } from "@/components/CourseCard";
import { StudentShell } from "@/components/StudentShell";
import { courses } from "@/lib/student-data";

export default function CoursesPage() {
  const [keyword, setKeyword] = useState("");
  const [category, setCategory] = useState("Tất cả");

  const categories = ["Tất cả", ...Array.from(new Set(courses.map((course) => course.category)))];
  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const matchKeyword = `${course.title} ${course.code} ${course.description}`.toLowerCase().includes(keyword.toLowerCase());
      const matchCategory = category === "Tất cả" || course.category === category;
      return matchKeyword && matchCategory;
    });
  }, [category, keyword]);

  return (
    <AuthGate>
      {(session) => (
        <StudentShell session={session}>
          <section className="page-heading">
            <div>
              <span className="eyebrow">Khóa học</span>
              <h1>Danh sách khóa học của tôi</h1>
              <p>Tìm khóa đang học, xem tiến độ và tiếp tục bài học gần nhất.</p>
            </div>
          </section>

          <section className="filter-bar">
            <input value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder="Tìm khóa học..." />
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((item) => <option key={item}>{item}</option>)}
            </select>
          </section>

          <section className="course-grid">
            {filteredCourses.map((course) => <CourseCard course={course} key={course.id} />)}
          </section>
        </StudentShell>
      )}
    </AuthGate>
  );
}
