export const STUDENT_SESSION_KEY = "lms_student_session";

export type StudentSession = {
  email: string;
  name: string;
  role: "STUDENT";
};

export function getStudentSession(): StudentSession | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(STUDENT_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StudentSession;
  } catch {
    window.localStorage.removeItem(STUDENT_SESSION_KEY);
    return null;
  }
}

export function setStudentSession(session: StudentSession) {
  window.localStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(session));
}

export function clearStudentSession() {
  window.localStorage.removeItem(STUDENT_SESSION_KEY);
}
