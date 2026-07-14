"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Plus, Send } from "lucide-react";
import { AuthGate } from "@/components/AuthGate";
import { StudentShell } from "@/components/StudentShell";
import { useAuth } from "@/components/AuthProvider";
import { learningService } from "@/services/learning.service";
import { courseService } from "@/services/course.service";
import { connectSupportChat } from "@/services/support-chat-websocket";
import {
  supportChatService,
  type SupportConversation,
  type SupportMessage,
} from "@/services/support-chat.service";
import type { Course, Enrollment } from "@/lib/types";
import "./messages.css";

function listOf<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object" && "content" in value) {
    const content = (value as { content?: unknown }).content;
    return Array.isArray(content) ? content as T[] : [];
  }
  return [];
}

function mergeMessage(messages: SupportMessage[], incoming: SupportMessage) {
  const next = messages.some((message) => message.id === incoming.id)
    ? messages.map((message) => message.id === incoming.id ? incoming : message)
    : [...messages, incoming];
  return next.sort((left, right) => String(left.createdAt || "").localeCompare(String(right.createdAt || "")));
}

function formatTime(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isFinite(date.getTime())
    ? new Intl.DateTimeFormat("vi-VN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }).format(date)
    : "";
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<SupportConversation[]>([]);
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [newCourseId, setNewCourseId] = useState("");
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  const selected = conversations.find((item) => item.id === selectedId);
  const availableCourses = useMemo(() => courses.filter(
    (course) => !conversations.some((conversation) => conversation.courseId === course.id),
  ), [conversations, courses]);

  const loadConversations = async () => {
    const items = await supportChatService.getConversations();
    setConversations(items || []);
    setSelectedId((current) => current || items?.[0]?.id || "");
  };

  useEffect(() => {
    let alive = true;
    Promise.all([supportChatService.getConversations(), learningService.getMyCourses()])
      .then(async ([chatItems, enrollmentData]) => {
        if (!alive) return;
        const enrollments = listOf<Enrollment>(enrollmentData);
        const courseItems = (await Promise.all(enrollments.map((enrollment) =>
          courseService.getCourse(enrollment.courseId).catch(() => null),
        ))).filter((course): course is Course => !!course);
        setConversations(chatItems || []);
        setSelectedId(chatItems?.[0]?.id || "");
        setCourses(courseItems);
        setNewCourseId(courseItems.find((course) => !chatItems?.some((chat) => chat.courseId === course.id))?.id || "");
      })
      .catch((err) => alive && setError(err instanceof Error ? err.message : "Không tải được tin nhắn."))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    let alive = true;
    setError("");
    supportChatService.getMessages(selectedId)
      .then((items) => alive && setMessages(items || []))
      .catch((err) => alive && setError(err instanceof Error ? err.message : "Không tải được hội thoại."));
    const disconnect = connectSupportChat(
      selectedId,
      (event) => {
        if (event.message) setMessages((current) => mergeMessage(current, event.message!));
        void supportChatService.markRead(selectedId).catch(() => undefined);
        void loadConversations().catch(() => undefined);
      },
      setConnected,
    );
    return () => {
      alive = false;
      disconnect();
    };
  }, [selectedId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createConversation = async () => {
    if (!newCourseId || creating) return;
    setCreating(true);
    try {
      setError("");
      const conversation = await supportChatService.createForCourse(newCourseId);
      await loadConversations();
      setSelectedId(conversation.id);
      setNewCourseId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không tạo được hội thoại.");
    } finally {
      setCreating(false);
    }
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const content = input.trim();
    if (!content || !selectedId || sending) return;
    setInput("");
    setSending(true);
    try {
      const message = await supportChatService.sendMessage(selectedId, content);
      setMessages((current) => mergeMessage(current, message));
      await loadConversations();
    } catch (err) {
      setInput(content);
      setError(err instanceof Error ? err.message : "Không gửi được tin nhắn.");
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthGate>
      <StudentShell>
        <section className="support-chat-page">
          <header className="support-chat-heading">
            <div><span className="eyebrow">Hỗ trợ học tập</span><h1>Chat với giảng viên</h1><p>Trao đổi riêng theo từng khóa học bạn đã đăng ký.</p></div>
            <div className="support-chat-create">
              <select value={newCourseId} onChange={(event) => setNewCourseId(event.target.value)} aria-label="Chọn khóa học">
                <option value="">Chọn khóa học</option>
                {availableCourses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
              </select>
              <button type="button" onClick={createConversation} disabled={!newCourseId || creating}>
                <Plus size={17} /> {creating ? "Đang tạo..." : "Tạo chat"}
              </button>
            </div>
          </header>

          {error && <p className="support-chat-error">{error}</p>}
          <div className="support-chat-layout">
            <aside className="support-chat-list">
              {loading && <p className="support-chat-empty">Đang tải...</p>}
              {!loading && conversations.length === 0 && <p className="support-chat-empty">Chọn một khóa học để bắt đầu trao đổi.</p>}
              {conversations.map((conversation) => (
                <button key={conversation.id} type="button" className={conversation.id === selectedId ? "active" : ""} onClick={() => setSelectedId(conversation.id)}>
                  <span className="support-chat-avatar">{conversation.instructorName.charAt(0).toUpperCase()}</span>
                  <span><strong>{conversation.instructorName}</strong><small>{conversation.courseName}</small><em>{conversation.lastMessage || "Chưa có tin nhắn"}</em></span>
                  {conversation.unreadCount > 0 && <b>{conversation.unreadCount}</b>}
                </button>
              ))}
            </aside>

            <section className="support-chat-room">
              {!selected ? (
                <div className="support-chat-placeholder"><MessageCircle size={38} /><strong>Chưa chọn hội thoại</strong><span>Tạo hoặc chọn một cuộc trò chuyện ở bên trái.</span></div>
              ) : (
                <>
                  <header><span className="support-chat-avatar">{selected.instructorName.charAt(0).toUpperCase()}</span><span><strong>{selected.instructorName}</strong><small>{selected.courseName} · {connected ? "Đang trực tuyến" : "Đang kết nối lại"}</small></span></header>
                  <div className="support-chat-messages">
                    {messages.length === 0 && <p className="support-chat-empty">Hãy gửi câu hỏi đầu tiên cho giảng viên.</p>}
                    {messages.map((message) => {
                      const mine = message.senderId === user?.id || message.senderId === selected.studentId;
                      return <div key={message.id} className={`support-chat-message ${mine ? "mine" : ""}`}><span>{message.content}</span><time>{formatTime(message.createdAt)}</time></div>;
                    })}
                    <div ref={endRef} />
                  </div>
                  <form className="support-chat-composer" onSubmit={submit}>
                    <textarea value={input} onChange={(event) => setInput(event.target.value.slice(0, 2000))} placeholder="Nhập tin nhắn..." rows={1} />
                    <button type="submit" disabled={!input.trim() || sending}><Send size={18} /></button>
                  </form>
                </>
              )}
            </section>
          </div>
        </section>
      </StudentShell>
    </AuthGate>
  );
}
