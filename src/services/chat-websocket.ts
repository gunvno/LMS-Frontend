import { Client, type IMessage, type StompSubscription } from "@stomp/stompjs";
import type { ChatMessage } from "@/services/chatbot.service";

const BASE_URL = process.env.NEXT_PUBLIC_API_GATEWAY_URL || "http://localhost:8080";

export interface ChatRealtimeEvent {
  eventType: "MESSAGE_CREATED" | "ASSISTANT_MESSAGE_CREATED" | "ASSISTANT_ERROR";
  conversationId: string;
  message?: ChatMessage;
  occurredAt: string;
}

type Options = {
  conversationId: string;
  accessToken: string;
  onEvent: (event: ChatRealtimeEvent) => void;
  onConnectionChange: (connected: boolean) => void;
};

export function connectChatWebSocket({
  conversationId,
  accessToken,
  onEvent,
  onConnectionChange,
}: Options) {
  let active = true;
  let subscription: StompSubscription | undefined;
  const setConnected = (connected: boolean) => {
    if (active) onConnectionChange(connected);
  };

  const client = new Client({
    brokerURL: buildWebSocketUrl(),
    connectHeaders: {
      "X-Conversation-Id": conversationId,
      "X-Chat-Token": accessToken,
    },
    reconnectDelay: 5_000,
    connectionTimeout: 8_000,
    heartbeatIncoming: 10_000,
    heartbeatOutgoing: 10_000,
    debug: () => undefined,
    onConnect: () => {
      subscription = client.subscribe(
        `/topic/chat/conversations/${conversationId}`,
        (message) => handleMessage(message, onEvent),
      );
      setConnected(true);
    },
    onDisconnect: () => setConnected(false),
    onStompError: () => setConnected(false),
    onWebSocketClose: () => setConnected(false),
    onWebSocketError: () => setConnected(false),
  });

  setConnected(false);
  client.activate();

  return () => {
    active = false;
    subscription?.unsubscribe();
    void client.deactivate();
  };
}

function handleMessage(message: IMessage, onEvent: (event: ChatRealtimeEvent) => void) {
  try {
    const event = JSON.parse(message.body) as ChatRealtimeEvent;
    if (event?.eventType && event.conversationId) onEvent(event);
  } catch {
    // Ignore malformed frames and keep the connection alive.
  }
}

function buildWebSocketUrl() {
  const url = new URL(BASE_URL);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = `${url.pathname.replace(/\/$/, "")}/chat/ws`;
  url.search = "";
  url.hash = "";
  return url.toString();
}
