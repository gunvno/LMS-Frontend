"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessagesSquare } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import styles from "./InstructorChatLauncher.module.css";

export function InstructorChatLauncher() {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading || !isAuthenticated || pathname === "/messages") {
    return null;
  }

  return (
    <Link className={styles.launcher} href="/messages" aria-label="Mở chat realtime với giảng viên">
      <MessagesSquare size={22} aria-hidden="true" />
      <span>Chat giảng viên</span>
    </Link>
  );
}
