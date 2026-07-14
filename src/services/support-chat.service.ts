import { api } from "@/lib/api-client";

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

export const supportChatService = {
  getConversations: () =>
    api.get<SupportConversation[]>("/chat/api/v1/support/conversations"),

  createForCourse: (courseId: string) =>
    api.post<SupportConversation>(`/chat/api/v1/support/conversations/courses/${courseId}`),

  getMessages: (conversationId: string) =>
    api.get<SupportMessage[]>(`/chat/api/v1/support/conversations/${conversationId}/messages`),

  sendMessage: (conversationId: string, content: string) =>
    api.post<SupportMessage>(`/chat/api/v1/support/conversations/${conversationId}/messages`, { content }),

  markRead: (conversationId: string) =>
    api.post<void>(`/chat/api/v1/support/conversations/${conversationId}/read`),
};
