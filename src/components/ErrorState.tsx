import { AlertTriangle } from "lucide-react";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  statusCode?: number;
}

export function ErrorState({
  title = "Đã xảy ra lỗi",
  message,
  onRetry,
  statusCode,
}: ErrorStateProps) {
  const displayMessage =
    statusCode === 403
      ? "Bạn không có quyền thực hiện thao tác này."
      : message || "Có lỗi xảy ra. Vui lòng thử lại.";

  return (
    <div className="error-state">
      <span className="error-state-icon">
        <AlertTriangle size={48} />
      </span>
      <strong>{title}</strong>
      <p>{displayMessage}</p>
      {onRetry && (
        <button className="ghost-button" onClick={onRetry}>
          Thử lại
        </button>
      )}
    </div>
  );
}
