export type Course = {
  id: string;
  title: string;
  code: string;
  category: string;
  level: string;
  progress: number;
  lessonsCompleted: number;
  lessonsTotal: number;
  duration: string;
  image: string;
  description: string;
  instructor: string;
  nextLessonId: string;
  modules: { id: string; title: string; duration: string; status: "DONE" | "IN_PROGRESS" | "LOCKED" }[];
};

export const studentStats = [
  { label: "Khóa đang học", value: "3", note: "2 khóa có bài mới trong tuần" },
  { label: "Bài học hoàn thành", value: "42", note: "+8 bài trong 7 ngày" },
  { label: "Quiz cần làm", value: "2", note: "1 quiz bắt buộc để hoàn thành khóa" },
  { label: "Chứng chỉ", value: "1", note: "Backend Foundation đã cấp" },
];

export const courses: Course[] = [
  {
    id: "backend-java",
    title: "Backend Java Spring Boot",
    code: "JAVA-BE-101",
    category: "Kỹ thuật Backend",
    level: "Trung cấp",
    progress: 68,
    lessonsCompleted: 18,
    lessonsTotal: 26,
    duration: "32 giờ",
    image: "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=1200&q=80",
    description: "Xây dựng backend LMS bằng Spring Boot, Spring Security, Feign Client, Consul và kiến trúc microservices.",
    instructor: "Nguyễn Minh Anh",
    nextLessonId: "feign-client-consul",
    modules: [
      { id: "m1", title: "Nền tảng Spring Boot", duration: "6 bài", status: "DONE" },
      { id: "m2", title: "REST API và validation", duration: "5 bài", status: "DONE" },
      { id: "m3", title: "Spring Security và JWT", duration: "7 bài", status: "DONE" },
      { id: "m4", title: "Feign Client với Consul", duration: "4 bài", status: "IN_PROGRESS" },
      { id: "m5", title: "Hoàn thành khóa và chứng chỉ", duration: "4 bài", status: "LOCKED" },
    ],
  },
  {
    id: "react-admin",
    title: "React Admin Dashboard",
    code: "FE-ADMIN-204",
    category: "Giao diện sản phẩm",
    level: "Trung cấp",
    progress: 42,
    lessonsCompleted: 9,
    lessonsTotal: 21,
    duration: "28 giờ",
    image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=1200&q=80",
    description: "Thiết kế dashboard quản trị rõ ràng, responsive, có bảng dữ liệu, form, trạng thái tải và luồng thao tác thật.",
    instructor: "Trần Thu Hà",
    nextLessonId: "admin-table-actions",
    modules: [
      { id: "m1", title: "Thiết kế layout quản trị", duration: "5 bài", status: "DONE" },
      { id: "m2", title: "Bảng dữ liệu và bộ lọc", duration: "6 bài", status: "IN_PROGRESS" },
      { id: "m3", title: "Form tạo mới và chỉnh sửa", duration: "5 bài", status: "LOCKED" },
      { id: "m4", title: "Kết nối API", duration: "5 bài", status: "LOCKED" },
    ],
  },
  {
    id: "database-design",
    title: "Database Design Essentials",
    code: "DB-FOUND-302",
    category: "Nền tảng dữ liệu",
    level: "Cơ bản",
    progress: 24,
    lessonsCompleted: 5,
    lessonsTotal: 20,
    duration: "24 giờ",
    image: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?auto=format&fit=crop&w=1200&q=80",
    description: "Thiết kế bảng, quan hệ, chỉ mục và dữ liệu seed cho hệ thống LMS có enrollment, lesson progress và certificate.",
    instructor: "Lê Quốc Việt",
    nextLessonId: "database-relation",
    modules: [
      { id: "m1", title: "Tư duy mô hình dữ liệu", duration: "4 bài", status: "DONE" },
      { id: "m2", title: "Quan hệ một nhiều và nhiều nhiều", duration: "6 bài", status: "IN_PROGRESS" },
      { id: "m3", title: "Index và tối ưu truy vấn", duration: "5 bài", status: "LOCKED" },
      { id: "m4", title: "Migration và seed data", duration: "5 bài", status: "LOCKED" },
    ],
  },
];

export const lessons = {
  "feign-client-consul": {
    id: "feign-client-consul",
    courseId: "backend-java",
    title: "Feign Client với Consul",
    duration: "18 phút",
    videoTitle: "Giao tiếp Learning Service và Course Service",
    summary: "Bài học giải thích cách khai báo Feign Client, service name trong Consul và phân tách API public/internal.",
    resources: ["Sơ đồ service discovery", "Mẫu Feign Client", "Checklist lỗi thường gặp"],
  },
  "admin-table-actions": {
    id: "admin-table-actions",
    courseId: "react-admin",
    title: "Bảng dữ liệu và menu thao tác",
    duration: "22 phút",
    videoTitle: "Thiết kế bảng dữ liệu dễ dùng",
    summary: "Bài học tập trung vào responsive table, menu ba chấm, empty state và hành động xem chi tiết.",
    resources: ["Component DataTable", "Pattern action menu", "Responsive checklist"],
  },
  "database-relation": {
    id: "database-relation",
    courseId: "database-design",
    title: "Quan hệ một nhiều và nhiều nhiều",
    duration: "26 phút",
    videoTitle: "Thiết kế quan hệ khóa học và bài học",
    summary: "Bài học so sánh bài học thuộc một khóa hoặc nhiều khóa và tác động đến enrollment progress.",
    resources: ["ERD mẫu", "Query repository", "Migration MySQL"],
  },
} as const;

export const quizzes = [
  { id: "spring-security-basic", title: "Spring Security cơ bản", course: "Backend Java Spring Boot", questions: 15, duration: "20 phút", required: true, status: "Cần làm", score: null },
  { id: "react-table-ux", title: "Thiết kế bảng dữ liệu", course: "React Admin Dashboard", questions: 10, duration: "15 phút", required: false, status: "Đang mở", score: null },
  { id: "database-normalization", title: "Chuẩn hóa dữ liệu", course: "Database Design Essentials", questions: 12, duration: "18 phút", required: true, status: "Đã đạt", score: 86 },
];

export const certificates = [
  { code: "LMS-2026-A91F3C7B", title: "Backend Foundation", issuedAt: "08/07/2026", expiresAt: "08/07/2028", status: "Còn hiệu lực" },
];

export const learningPlan = [
  { time: "09:00", title: "Hoàn thành bài: Feign Client với Consul", type: "Bài học", status: "Đang học" },
  { time: "14:00", title: "Làm quiz: Spring Security cơ bản", type: "Quiz", status: "Cần làm" },
  { time: "20:30", title: "Đọc tài liệu: Enrollment workflow", type: "Tài liệu đọc", status: "Tự học" },
];
