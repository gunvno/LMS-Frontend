"use client";

import { BellOff, BellRing, LoaderCircle } from "lucide-react";
import { useFirebaseMessaging } from "@/components/FirebaseMessagingProvider";

const STATUS_COPY = {
  checking: {
    title: "Đang kiểm tra thông báo",
    description: "Vui lòng chờ trong giây lát.",
  },
  unsupported: {
    title: "Trình duyệt không hỗ trợ",
    description: "Hãy dùng phiên bản Chrome, Edge, Firefox hoặc Safari mới hơn.",
  },
  "not-enabled": {
    title: "Thông báo trình duyệt đang tắt",
    description: "Bật để nhận cập nhật ngay cả khi không mở trang thông báo.",
  },
  denied: {
    title: "Thông báo đang bị chặn",
    description: "Cho phép thông báo trong cài đặt trang web rồi tải lại trang.",
  },
  registering: {
    title: "Đang bật thông báo",
    description: "EduFlow đang kết nối trình duyệt của bạn.",
  },
  enabled: {
    title: "Thông báo trình duyệt đã bật",
    description: "Thiết bị này sẽ nhận được các cập nhật mới.",
  },
  error: {
    title: "Chưa kết nối được thông báo",
    description: "Bạn có thể thử kết nối lại ngay bây giờ.",
  },
} as const;

export function BrowserNotificationControl({ compact = false }: { compact?: boolean }) {
  const { status, error, enableNotifications } = useFirebaseMessaging();
  const copy = STATUS_COPY[status];
  const canEnable = status === "not-enabled" || status === "error";
  const Icon = status === "denied" || status === "unsupported" ? BellOff : BellRing;

  return (
    <div className={`browser-notification-control ${compact ? "compact" : ""} status-${status}`}>
      <span className="browser-notification-icon">
        {status === "registering" || status === "checking"
          ? <LoaderCircle className="spin" size={18} />
          : <Icon size={18} />}
      </span>
      <span className="browser-notification-copy">
        <strong>{copy.title}</strong>
        <small>{error || copy.description}</small>
      </span>
      {canEnable && (
        <button type="button" onClick={() => void enableNotifications()}>
          {status === "error" ? "Thử lại" : "Bật thông báo"}
        </button>
      )}
    </div>
  );
}

