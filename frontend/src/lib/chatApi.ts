import { apiRequest } from "@/lib/apiClient";

export type ChatParticipant = {
  _id: string;
  fullName: string;
  email: string;
  avatar?: string;
  role: string;
};

export type Conversation = {
  _id: string;
  participants: ChatParticipant[];
  jobId?: { _id: string; title: string } | null;
  lastMessage: string;
  lastMessageAt?: string;
  createdAt: string;
  blockedBy?: string | null;
};

export type ChatMessage = {
  _id: string;
  conversationId: string;
  senderId: { _id: string; fullName: string; avatar?: string };
  text: string;
  isRead: boolean;
  createdAt: string;
};

export const getConversationsRequest = () =>
  apiRequest<{ conversations: Conversation[] }>("/api/chat/conversations");

export const findOrCreateConversationRequest = (otherUserId: string, jobId?: string) =>
  apiRequest<{ conversation: Conversation }>("/api/chat/conversations", {
    method: "POST",
    body: { otherUserId, jobId },
  });

export const getMessagesRequest = (conversationId: string) =>
  apiRequest<{ messages: ChatMessage[] }>(`/api/chat/${conversationId}/messages`);

export const sendMessageRequest = (conversationId: string, text: string) =>
  apiRequest<{ message: ChatMessage }>(`/api/chat/${conversationId}/messages`, {
    method: "POST",
    body: { text },
  });

export const uploadFileRequest = (fileName: string, fileData: string) =>
  apiRequest<{ fileUrl: string }>("/api/chat/upload", {
    method: "POST",
    body: { fileName, fileData },
  });

export const clearChatRequest = (conversationId: string) =>
  apiRequest<{ message: string }>(`/api/chat/${conversationId}/messages`, {
    method: "DELETE",
  });

export const blockChatRequest = (conversationId: string, action: "block" | "unblock") =>
  apiRequest<{ message: string }>(`/api/chat/${conversationId}/block`, {
    method: "PATCH",
    body: { action },
  });
