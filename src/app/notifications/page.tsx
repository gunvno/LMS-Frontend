"use client";

import { useCallback, useEffect, useState } from "react";
import { Bell, CheckCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { AuthGate } from "@/components/AuthGate";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { StudentShell } from "@/components/StudentShell";
import { formatApiDate } from "@/lib/date";
import type { Notice, PageData } from "@/lib/types";
import { noticeService } from "@/services/notice.service";
import "./notifications.css";

const PAGE_SIZE = 10;

function emptyPage(page: number): PageData<Notice> {
  return {
    content: [],
    totalElements: 0,
    totalPages: 0,
    number: page,
    size: PAGE_SIZE,
  };
}

export default function NotificationsPage() {
  const [noticePage, setNoticePage] = useState<PageData<Notice>>(() => emptyPage(0));
  const [page, setPage] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState("");
  const [markingAll, setMarkingAll] = useState(false);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");

  const loadNotices = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextPage, unread] = await Promise.all([
        noticeService.getMyNotices({ page, size: PAGE_SIZE }),
        noticeService.getUnreadCount(),
      ]);
      setNoticePage(nextPage || emptyPage(page));
      setUnreadCount(unread || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tải được danh sách thông báo.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadNotices();
  }, [loadNotices]);

  const markRead = async (notice: Notice) => {
    if (notice.readStatus === "READ" || markingId === notice.recipientId) return;
    setMarkingId(notice.recipientId);
    setActionError("");
    try {
      await noticeService.markRead(notice.recipientId);
      setNoticePage((current) => ({
        ...current,
        content: current.content.map((item) => item.recipientId === notice.recipientId
          ? { ...item, readStatus: "READ", readAt: new Date().toISOString() }
          : item),
      }));
      setUnreadCount((count) => Math.max(0, count - 1));
      window.dispatchEvent(new Event("lms:notifications-updated"));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Không đánh dấu được thông báo đã đọc.");
    } finally {
      setMarkingId("");
    }
  };

  const markAllRead = async () => {
    if (!unreadCount || markingAll) return;
    setMarkingAll(true);
    setActionError("");
    try {
      await noticeService.markAllRead();
      const readAt = new Date().toISOString();
      setNoticePage((current) => ({
        ...current,
        content: current.content.map((item) => ({ ...item, readStatus: "READ", readAt })),
      }));
      setUnreadCount(0);
      window.dispatchEvent(new Event("lms:notifications-updated"));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Không đánh dấu được tất cả thông báo.");
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <AuthGate>
      <StudentShell>
        <section className="page-heading notifications-heading">
          <div>
            <span className="eyebrow">Trung tâm thông báo</span>
            <h1>Tất cả thông báo</h1>
            <p>Theo dõi các cập nhật mới nhất về khóa học, thanh toán và chứng chỉ.</p>
          </div>
          <button
            type="button"
            className="ghost-button notifications-read-all"
            onClick={() => void markAllRead()}
            disabled={!unreadCount || markingAll}
          >
            <CheckCheck size={17} />
            {markingAll ? "Đang cập nhật..." : `Đánh dấu đã đọc (${unreadCount})`}
          </button>
        </section>

        {actionError && <div className="form-error notifications-action-error">{actionError}</div>}

        {loading ? (
          <div className="loading-card">Đang tải thông báo...</div>
        ) : error ? (
          <ErrorState message={error} onRetry={loadNotices} />
        ) : noticePage.content.length === 0 ? (
          <EmptyState
            title="Chưa có thông báo"
            description="Các cập nhật dành cho bạn sẽ xuất hiện tại đây."
            icon={<Bell size={46} />}
          />
        ) : (
          <>
            <section className="notifications-list" aria-label="Danh sách thông báo">
              {noticePage.content.map((notice) => (
                <button
                  key={notice.recipientId}
                  type="button"
                  className={`notifications-list-item ${notice.readStatus === "UNREAD" ? "unread" : ""}`}
                  onClick={() => void markRead(notice)}
                  disabled={markingId === notice.recipientId}
                >
                  <span className="notifications-list-icon"><Bell size={18} /></span>
                  <span className="notifications-list-copy">
                    <span className="notifications-list-title">
                      <strong>{notice.title}</strong>
                      {notice.readStatus === "UNREAD" && <b>Chưa đọc</b>}
                    </span>
                    <span>{notice.content}</span>
                    <time>{formatApiDate(notice.sentAt || notice.createdDate)}</time>
                  </span>
                </button>
              ))}
            </section>

            {noticePage.totalPages > 1 && (
              <nav className="notifications-pagination" aria-label="Phân trang thông báo">
                <button type="button" onClick={() => setPage((value) => value - 1)} disabled={page === 0}>
                  <ChevronLeft size={16} /> Trước
                </button>
                <span>Trang {page + 1} / {noticePage.totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPage((value) => value + 1)}
                  disabled={page >= noticePage.totalPages - 1}
                >
                  Sau <ChevronRight size={16} />
                </button>
              </nav>
            )}
          </>
        )}
      </StudentShell>
    </AuthGate>
  );
}
