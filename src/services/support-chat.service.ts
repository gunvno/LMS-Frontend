import { api } from "@/lib/api-client";
import { normalizeChatDateTime } from "@/lib/chat-date-time";

export type SupportConversation = {
  id: string;
  courseId: string;
  courseName: string;
  studentId: string;
  studentName: string;
  instructorId: string;
  instructorName: string;
  status: "ACTIVE" | "CLOSED";
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
  createdAt: string;
};

export type SupportMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readAt?: string;
  createdAt: string;
};

export type RawSupportMessage = Omit<SupportMessage, "createdAt"> & {
  createdAt?: unknown;
  createdDate?: unknown;
};

export function normalizeSupportMessage(message: RawSupportMessage): SupportMessage {
  return {
    ...message,
    createdAt: normalizeChatDateTime(message.createdAt ?? message.createdDate),
  };
}

export const supportChatService = {
  getConversations: () =>
    api.get<SupportConversation[]>("/chat/api/v1/support/conversations"),

  createForCourse: (courseId: string) =>
    api.post<SupportConversation>(`/chat/api/v1/support/conversations/courses/${courseId}`),

  getMessages: (conversationId: string) =>
    api.get<RawSupportMessage[]>(`/chat/api/v1/support/conversations/${conversationId}/messages`)
      .then((messages) => (messages || []).map(normalizeSupportMessage)),

  sendMessage: (conversationId: string, content: string) =>
    api.post<RawSupportMessage>(`/chat/api/v1/support/conversations/${conversationId}/messages`, { content })
      .then(normalizeSupportMessage),

  markRead: (conversationId: string) =>
    api.post<void>(`/chat/api/v1/support/conversations/${conversationId}/read`),
};
