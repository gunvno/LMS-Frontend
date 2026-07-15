"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import {
  clearMessagingBinding,
  firebaseMessagingMetadata,
  getMessagingBinding,
  getMessagingRuntime,
  getWebDeviceId,
  setMessagingBinding,
  unregisterFirebaseMessagingLocally,
} from "@/services/firebase-messaging.service";
import { noticeService } from "@/services/notice.service";

export type FirebaseMessagingStatus =
  | "checking"
  | "unsupported"
  | "not-enabled"
  | "denied"
  | "registering"
  | "enabled"
  | "error";

type FirebaseMessagingContextValue = {
  status: FirebaseMessagingStatus;
  error: string;
  enableNotifications: () => Promise<void>;
};

const FirebaseMessagingContext = createContext<FirebaseMessagingContextValue | null>(null);

function toFriendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : "";
  if (message.includes("permission-blocked")) {
    return "Trình duyệt đang chặn thông báo. Hãy cho phép thông báo trong cài đặt trang web.";
  }
  return "Không thể bật thông báo trình duyệt. Vui lòng thử lại.";
}

export function FirebaseMessagingProvider({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const toast = useToast();
  const toastRef = useRef(toast);
  const [status, setStatus] = useState<FirebaseMessagingStatus>("checking");
  const [error, setError] = useState("");
  const [registrationRequest, setRegistrationRequest] = useState(0);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  const enableNotifications = useCallback(async () => {
    setError("");
    if (typeof window === "undefined" || !("Notification" in window)) {
      setStatus("unsupported");
      return;
    }

    setStatus("registering");
    const permission = Notification.permission === "default"
      ? await Notification.requestPermission()
      : Notification.permission;

    if (permission === "denied") {
      setStatus("denied");
      setError("Bạn đã chặn thông báo cho trang này trong trình duyệt.");
      return;
    }
    if (permission !== "granted") {
      setStatus("not-enabled");
      return;
    }
    setRegistrationRequest((value) => value + 1);
  }, []);

  useEffect(() => {
    if (isLoading) return;

    let cancelled = false;
    let unsubscribeRegistered: () => void = () => {};
    let unsubscribeUnregistered: () => void = () => {};
    let unsubscribeMessage: () => void = () => {};

    const setup = async () => {
      await Promise.resolve();
      if (cancelled) return;
      if (!user) {
        setStatus("not-enabled");
        setError("");
        if (getMessagingBinding()) {
          await unregisterFirebaseMessagingLocally().catch(() => undefined);
        }
        return;
      }
      if (typeof window === "undefined" || !("Notification" in window)) {
        setStatus("unsupported");
        return;
      }
      if (Notification.permission === "default") {
        setStatus("not-enabled");
        return;
      }
      if (Notification.permission === "denied") {
        setStatus("denied");
        return;
      }

      setStatus("registering");
      setError("");
      try {
        const runtime = await getMessagingRuntime();
        if (!runtime) {
          if (!cancelled) setStatus("unsupported");
          return;
        }

        const previousBinding = getMessagingBinding();
        if (previousBinding && previousBinding.userId !== user.id) {
          await runtime.messagingApi.unregister(runtime.messaging);
          clearMessagingBinding(previousBinding.installationId);
        }

        unsubscribeRegistered = runtime.messagingApi.onRegistered(
          runtime.messaging,
          (installationId) => {
            if (cancelled) return;
            setMessagingBinding({ userId: user.id, installationId });
            void noticeService.registerDevice({
              installationId,
              deviceType: "WEB",
              deviceId: getWebDeviceId(),
              appVersion: firebaseMessagingMetadata.appVersion,
            }).then(() => {
              if (!cancelled) setStatus("enabled");
            }).catch(async (registerError) => {
              await runtime.messagingApi.unregister(runtime.messaging).catch(() => undefined);
              if (!cancelled) {
                setStatus("error");
                setError(toFriendlyError(registerError));
              }
            });
          }
        );

        unsubscribeUnregistered = runtime.messagingApi.onUnregistered(
          runtime.messaging,
          (installationId) => {
            clearMessagingBinding(installationId);
            void noticeService.deactivateDevice(installationId).catch(() => undefined);
            if (!cancelled) setStatus("not-enabled");
          }
        );

        unsubscribeMessage = runtime.messagingApi.onMessage(runtime.messaging, (payload) => {
          if (cancelled) return;
          const title = payload.notification?.title || payload.data?.title || "Bạn có thông báo mới";
          const body = payload.notification?.body || payload.data?.body;
          toastRef.current.info(body ? `${title}: ${body}` : title);
          window.dispatchEvent(new CustomEvent("lms:notifications-updated", { detail: payload }));
        });

        await runtime.messagingApi.register(runtime.messaging, {
          vapidKey: firebaseMessagingMetadata.vapidKey,
          serviceWorkerRegistration: runtime.serviceWorkerRegistration,
        });
      } catch (setupError) {
        if (!cancelled) {
          setStatus("error");
          setError(toFriendlyError(setupError));
        }
      }
    };

    void setup();
    return () => {
      cancelled = true;
      unsubscribeRegistered();
      unsubscribeUnregistered();
      unsubscribeMessage();
    };
  }, [isLoading, registrationRequest, user]);

  const value = useMemo(
    () => ({ status, error, enableNotifications }),
    [enableNotifications, error, status]
  );

  return (
    <FirebaseMessagingContext.Provider value={value}>
      {children}
    </FirebaseMessagingContext.Provider>
  );
}

export function useFirebaseMessaging(): FirebaseMessagingContextValue {
  const context = useContext(FirebaseMessagingContext);
  if (!context) {
    throw new Error("useFirebaseMessaging must be used within FirebaseMessagingProvider");
  }
  return context;
}
