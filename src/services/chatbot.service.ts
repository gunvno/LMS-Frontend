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
    return chatRequest<ChatConversation>(conversationsPath, { method: "POST" });
  },

  getConversation(conversationId: string, accessToken: string) {
    return chatRequest<ChatConversation>(
      `${conversationsPath}/${conversationId}`,
      {},
      accessToken,
    );
  },

  getMessages(conversationId: string, accessToken: string) {
    return chatRequest<ChatMessage[]>(
      `${conversationsPath}/${conversationId}/messages`,
      {},
      accessToken,
    );
  },

  sendMessage(conversationId: string, accessToken: string, content: string) {
    return chatRequest<ChatMessage>(
      `${conversationsPath}/${conversationId}/messages`,
      { method: "POST", body: JSON.stringify({ content }) },
      accessToken,
    );
  },
};
