"use client";

import { useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { STUDENT_SESSION_KEY, type StudentSession } from "@/lib/student-auth";

type AuthGateProps = {
  children: (session: StudentSession) => ReactNode;
};

function subscribeToSession(listener: () => void) {
  window.addEventListener("storage", listener);
  return () => window.removeEventListener("storage", listener);
}

function readSessionRaw() {
  return window.localStorage.getItem(STUDENT_SESSION_KEY);
}

function readServerSessionRaw() {
  return null;
}

function parseSession(raw: string | null): StudentSession | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StudentSession;
  } catch {
    return null;
  }
}

export function AuthGate({ children }: AuthGateProps) {
  const router = useRouter();
  const sessionRaw = useSyncExternalStore(subscribeToSession, readSessionRaw, readServerSessionRaw);
  const session = useMemo(() => parseSession(sessionRaw), [sessionRaw]);

  useEffect(() => {
    if (sessionRaw === null) {
      router.replace("/login");
    }
  }, [router, sessionRaw]);

  if (!session) {
    return (
      <main className="loading-screen">
        <div className="loading-card">
          <span className="brand-symbol">E</span>
          <strong>Đang kiểm tra phiên đăng nhập...</strong>
          <p>Vui lòng chờ trong giây lát.</p>
        </div>
      </main>
    );
  }

  return children(session);
}
