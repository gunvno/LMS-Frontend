import type { CourseLevel } from "@/lib/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:8080";

export interface RecommendedCourse {
  id: string;
  name: string;
  description?: string;
  level?: CourseLevel;
  durationMinutes?: number;
  price?: number;
}

export interface ChatConversation {
  id: string;
  accessToken?: string;
  status: "ACTIVE" | "CLOSED";
  assistantProcessing: boolean;
  lastMessage?: string;
  lastMessageAt?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: "USER" | "ASSISTANT";
  content: string;
  recommendedCourses: RecommendedCourse[];
  error: boolean;
  createdAt: string;
}

export function normalizeChatDateTime(value: unknown): string {
  if (typeof value === "string") return value;

  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }

  if (Array.isArray(value) && value.length >= 3) {
    const parts = value.map(Number);
    if (parts.every(Number.isFinite)) {
      const [year, month, day, hour = 0, minute = 0, second = 0, nanosecond = 0] = parts;
      const pad = (part: number, length = 2) => String(Math.trunc(part)).padStart(length, "0");
      const milliseconds = Math.trunc(nanosecond / 1_000_000);
      return `${pad(year, 4)}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}.${pad(milliseconds, 3)}`;
    }
  }

  return "";
}

export function normalizeChatMessage(message: ChatMessage): ChatMessage {
  return {
    ...message,
    recommendedCourses: Array.isArray(message.recommendedCourses)
      ? message.recommendedCourses
      : [],
    createdAt: normalizeChatDateTime(message.createdAt),
  };
}

function normalizeChatConversation(conversation: ChatConversation): ChatConversation {
  return {
    ...conversation,
    createdAt: normalizeChatDateTime(conversation.createdAt),
    lastMessageAt: conversation.lastMessageAt
      ? normalizeChatDateTime(conversation.lastMessageAt)
      : undefined,
  };
}

type ApiEnvelope<T> = {
  data?: T;
  errorCode?: string;
  message?: string;
};

async function chatRequest<T>(
  path: string,
  options: RequestInit = {},
  accessToken?: string,
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  headers.set("Accept-Language", "vi");
  if (accessToken) headers.set("X-Chat-Token", accessToken);

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  const payload = await response.json().catch(() => null) as ApiEnvelope<T> | null;
  if (!response.ok || (payload?.errorCode && payload.errorCode !== "EV-200")) {
    throw new Error(payload?.message || `Không thể kết nối trợ lý (${response.status})`);
  }
  return payload?.data as T;
}

const conversationsPath = "/chat/api/v1/chat/conversations";

export const chatbotService = {
  createConversation() {
    return chatRequest<ChatConversation>(conversationsPath, { method: "POST" })
      .then(normalizeChatConversation);
  },

  getConversation(conversationId: string, accessToken: string) {
    return chatRequest<ChatConversation>(
      `${conversationsPath}/${conversationId}`,
      {},
      accessToken,
    ).then(normalizeChatConversation);
  },

  getMessages(conversationId: string, accessToken: string) {
    return chatRequest<ChatMessage[]>(
      `${conversationsPath}/${conversationId}/messages`,
      {},
      accessToken,
    ).then((messages) => messages.map(normalizeChatMessage));
  },

  sendMessage(conversationId: string, accessToken: string, content: string) {
    return chatRequest<ChatMessage>(
      `${conversationsPath}/${conversationId}/messages`,
      { method: "POST", body: JSON.stringify({ content }) },
      accessToken,
    ).then(normalizeChatMessage);
  },
};
