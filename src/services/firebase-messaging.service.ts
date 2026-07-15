import type { FirebaseApp } from "firebase/app";
import type { Messaging } from "firebase/messaging";
import { noticeService } from "@/services/notice.service";

const FIREBASE_SDK_VERSION = "12.16.0";
const DEVICE_ID_KEY = "lms_web_device_id";
const BINDING_KEY = "lms_firebase_messaging_binding";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export type MessagingBinding = {
  userId: string;
  installationId: string;
};

export type MessagingRuntime = {
  app: FirebaseApp;
  messaging: Messaging;
  serviceWorkerRegistration: ServiceWorkerRegistration;
  messagingApi: typeof import("firebase/messaging");
};

let runtimePromise: Promise<MessagingRuntime | null> | null = null;

function hasFirebaseConfig(): boolean {
  return Object.values(firebaseConfig).every(
    (value) => typeof value === "string" && value.trim().length > 0
  );
}

function buildWorkerUrl(): string {
  const params = new URLSearchParams();
  Object.entries(firebaseConfig).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });
  params.set("sdkVersion", FIREBASE_SDK_VERSION);
  return `/firebase-messaging-sw.js?${params.toString()}`;
}

export function getMessagingBinding(): MessagingBinding | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(BINDING_KEY);
  if (!raw) return null;
  try {
    const binding = JSON.parse(raw) as MessagingBinding;
    return binding.userId && binding.installationId ? binding : null;
  } catch {
    return null;
  }
}

export function setMessagingBinding(binding: MessagingBinding): void {
  window.localStorage.setItem(BINDING_KEY, JSON.stringify(binding));
}

export function clearMessagingBinding(installationId?: string): void {
  const current = getMessagingBinding();
  if (!installationId || current?.installationId === installationId) {
    window.localStorage.removeItem(BINDING_KEY);
  }
}

export function getWebDeviceId(): string {
  const stored = window.localStorage.getItem(DEVICE_ID_KEY);
  if (stored) return stored;

  const id = typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `web-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(DEVICE_ID_KEY, id);
  return id;
}

export async function getMessagingRuntime(): Promise<MessagingRuntime | null> {
  if (typeof window === "undefined" || !hasFirebaseConfig()) return null;
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return null;

  if (!runtimePromise) {
    runtimePromise = (async () => {
      const [appApi, messagingApi] = await Promise.all([
        import("firebase/app"),
        import("firebase/messaging"),
      ]);
      if (!(await messagingApi.isSupported())) return null;

      const app = appApi.getApps().length
        ? appApi.getApp()
        : appApi.initializeApp(firebaseConfig);
      const serviceWorkerRegistration = await navigator.serviceWorker.register(
        buildWorkerUrl(),
        { scope: "/", updateViaCache: "none" }
      );
      const messaging = messagingApi.getMessaging(app);
      return { app, messaging, serviceWorkerRegistration, messagingApi };
    })().catch((error) => {
      runtimePromise = null;
      throw error;
    });
  }
  return runtimePromise;
}

export async function unregisterFirebaseMessagingLocally(): Promise<boolean> {
  const binding = getMessagingBinding();
  const runtime = await getMessagingRuntime();
  if (!runtime) return false;
  await runtime.messagingApi.unregister(runtime.messaging);
  clearMessagingBinding(binding?.installationId);
  return true;
}

/** Must run while the current HttpOnly session is still valid. */
export async function deactivateFirebaseMessaging(): Promise<void> {
  const binding = getMessagingBinding();
  if (!binding) return;
  let backendDeactivated = false;
  try {
    await noticeService.deactivateDevice(binding.installationId);
    backendDeactivated = true;
  } catch {
    // Firebase unregister below still prevents this browser from receiving the old user's push.
  }

  const firebaseUnregistered = await unregisterFirebaseMessagingLocally().catch(() => false);
  if (backendDeactivated || firebaseUnregistered) {
    clearMessagingBinding(binding.installationId);
  }
}

export const firebaseMessagingMetadata = {
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || "0.1.0",
  vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "",
};
