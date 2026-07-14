"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  Bot,
  LoaderCircle,
  MessageCircle,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import {
  chatbotService,
  normalizeChatDateTime,
  type ChatConversation,
  type ChatMessage,
} from "@/services/chatbot.service";
import { connectChatWebSocket } from "@/services/chat-websocket";
import styles from "./ChatWidget.module.css";

const CONVERSATION_ID_KEY = "lms_ai_chat_conversation_id";
const CHAT_TOKEN_KEY = "lms_ai_chat_token";
const QUICK_QUESTIONS = [
  "Có khóa Backend Java dưới 1,5 triệu không?",
  "Gợi ý khóa học cho người mới",
];

function mergeMessage(current: ChatMessage[], incoming: ChatMessage) {
  const merged = current.some((message) => message.id === incoming.id)
    ? current.map((message) => message.id === incoming.id ? incoming : message)
    : [...current, incoming];
  return merged.sort((left, right) =>
    normalizeChatDateTime(left.createdAt).localeCompare(normalizeChatDateTime(right.createdAt)));
}

function formatPrice(price?: number) {
  if (price === undefined || price === null) return "Xem chi tiết";
  if (price === 0) return "Miễn phí";
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(price);
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [accessToken, setAccessToken] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    let alive = true;

    const load = async () => {
      setIsLoading(true);
      setError("");
      try {
        let id = window.localStorage.getItem(CONVERSATION_ID_KEY) || "";
        let token = window.localStorage.getItem(CHAT_TOKEN_KEY) || "";
        let activeConversation: ChatConversation;

        try {
          if (!id || !token) throw new Error("No saved conversation");
          activeConversation = await chatbotService.getConversation(id, token);
        } catch {
          activeConversation = await chatbotService.createConversation();
          id = activeConversation.id;
          token = activeConversation.accessToken || "";
          window.localStorage.setItem(CONVERSATION_ID_KEY, id);
          window.localStorage.setItem(CHAT_TOKEN_KEY, token);
        }

        const history = await chatbotService.getMessages(id, token);
        if (!alive) return;
        setConversation(activeConversation);
        setAccessToken(token);
        setMessages(history);
        setIsSending(activeConversation.assistantProcessing);
      } catch (loadError) {
        if (alive) {
          setError(loadError instanceof Error
            ? loadError.message
            : "Chưa thể kết nối trợ lý AI.");
        }
      } finally {
        if (alive) setIsLoading(false);
      }
    };

    void load();
    return () => { alive = false; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !conversation?.id || !accessToken) return;
    return connectChatWebSocket({
      conversationId: conversation.id,
      accessToken,
      onConnectionChange: (connected) => {
        setSocketConnected(connected);
        if (connected) {
          void Promise.all([
            chatbotService.getConversation(conversation.id, accessToken),
            chatbotService.getMessages(conversation.id, accessToken),
          ]).then(([activeConversation, history]) => {
            setConversation(activeConversation);
            setMessages(history);
            setIsSending(activeConversation.assistantProcessing);
          }).catch(() => undefined);
        }
      },
      onEvent: (event) => {
        if (event.message) {
          setMessages((current) => mergeMessage(current, event.message!));
        }
        if (event.eventType === "ASSISTANT_MESSAGE_CREATED" || event.eventType === "ASSISTANT_ERROR") {
          setIsSending(false);
        }
      },
    });
  }, [accessToken, conversation?.id, isOpen]);

  useEffect(() => {
    if (!isOpen || !conversation?.id || !accessToken || socketConnected) return;
    const interval = window.setInterval(async () => {
      if (document.hidden) return;
      try {
        const [activeConversation, history] = await Promise.all([
          chatbotService.getConversation(conversation.id, accessToken),
          chatbotService.getMessages(conversation.id, accessToken),
        ]);
        setConversation(activeConversation);
        setMessages(history);
        setIsSending(activeConversation.assistantProcessing);
      } catch {
        // Keep current messages; the next interval or WebSocket reconnect can recover.
      }
    }, 5_000);
    return () => window.clearInterval(interval);
  }, [accessToken, conversation?.id, isOpen, socketConnected]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSending]);

  useEffect(() => {
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  const sendMessage = async (rawMessage: string) => {
    const content = rawMessage.trim();
    if (!content || isSending || isLoading || !conversation || !accessToken) return;
    setInput("");
    setError("");
    setIsSending(true);
    try {
      const sent = await chatbotService.sendMessage(conversation.id, accessToken, content);
      setMessages((current) => mergeMessage(current, sent));
    } catch (sendError) {
      setInput(content);
      setIsSending(false);
      setError(sendError instanceof Error ? sendError.message : "Không gửi được tin nhắn.");
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  };

  return (
    <aside className={styles.root} aria-label="Trợ lý khóa học AI">
      {isOpen && (
        <section className={styles.panel} role="dialog" aria-label="Trò chuyện với trợ lý khóa học">
          <header className={styles.header}>
            <div className={styles.identity}>
              <span className={styles.avatar}><Sparkles size={20} /></span>
              <span>
                <strong>Trợ lý EduFlow</strong>
                <span>{isLoading ? "Đang tải hội thoại..." : socketConnected ? "Đang trực tuyến" : "Đang kết nối lại..."}</span>
              </span>
            </div>
            <button type="button" className={styles.iconButton} onClick={() => setIsOpen(false)} aria-label="Đóng cửa sổ chat">
              <X size={19} />
            </button>
          </header>

          <div className={styles.messages} aria-live="polite">
            {!isLoading && messages.length === 0 && (
              <div className={styles.messageRow}>
                <span className={styles.botMark} aria-hidden="true"><Bot size={15} /></span>
                <div className={styles.messageGroup}>
                  <div className={styles.bubble}>
                    Chào bạn! Mình có thể giúp tìm khóa học theo chủ đề, học phí, trình độ hoặc thời lượng. Bạn đang muốn học gì?
                  </div>
                </div>
              </div>
            )}
            {messages.map((message) => {
              const mine = message.senderType === "USER";
              return (
                <div key={message.id} className={`${styles.messageRow} ${mine ? styles.messageRowUser : ""}`}>
                  {!mine && <span className={styles.botMark} aria-hidden="true"><Bot size={15} /></span>}
                  <div className={styles.messageGroup}>
                    <div className={`${styles.bubble} ${mine ? styles.bubbleUser : ""} ${message.error ? styles.bubbleError : ""}`}>
                      {message.content}
                    </div>
                    {!!message.recommendedCourses?.length && (
                      <div className={styles.courses} aria-label="Khóa học được gợi ý">
                        {message.recommendedCourses.map((course) => (
                          <Link key={course.id} href={`/courses/${course.id}`} className={styles.course}>
                            <span><strong>{course.name}</strong><span>{formatPrice(course.price)}</span></span>
                            <ArrowRight size={16} aria-hidden="true" />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {(isLoading || isSending) && (
              <div className={styles.messageRow}>
                <span className={styles.botMark} aria-hidden="true"><Bot size={15} /></span>
                <div className={styles.bubble}>
                  <span className={styles.typing}>
                    <LoaderCircle className={styles.spinner} size={15} />
                    {isLoading ? "Đang tải hội thoại..." : "Đang tìm khóa học phù hợp..."}
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div>
            {!isLoading && messages.length === 0 && (
              <div className={styles.suggestions} aria-label="Câu hỏi gợi ý">
                {QUICK_QUESTIONS.map((question) => (
                  <button key={question} type="button" className={styles.suggestion} onClick={() => void sendMessage(question)}>
                    {question}
                  </button>
                ))}
              </div>
            )}
            {error && <p className={styles.errorBanner} role="alert">{error}</p>}
            <footer className={styles.composer}>
              <form className={styles.form} onSubmit={submit}>
                <textarea
                  ref={inputRef}
                  className={styles.input}
                  value={input}
                  onChange={(event) => setInput(event.target.value.slice(0, 2000))}
                  onKeyDown={handleInputKeyDown}
                  rows={1}
                  maxLength={2000}
                  placeholder="Hỏi về khóa học..."
                  aria-label="Nhập câu hỏi"
                  disabled={isSending || isLoading || !conversation}
                />
                <button type="submit" className={styles.sendButton} disabled={isSending || isLoading || !input.trim() || !conversation} aria-label="Gửi tin nhắn">
                  <Send size={18} />
                </button>
              </form>
              <p className={styles.hint}>Enter để gửi · Shift + Enter để xuống dòng</p>
            </footer>
          </div>
        </section>
      )}

      <button type="button" className={styles.launcher} onClick={() => setIsOpen((open) => !open)} aria-label={isOpen ? "Đóng trợ lý AI" : "Mở trợ lý AI"} title="Trợ lý AI" aria-expanded={isOpen}>
        {isOpen ? <X size={24} /> : <MessageCircle size={25} />}
      </button>
    </aside>
  );
}
