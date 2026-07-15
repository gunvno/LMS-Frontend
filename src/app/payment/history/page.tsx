"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Ban, CreditCard, ReceiptText } from "lucide-react";
import { AuthGate } from "@/components/AuthGate";
import { ActionMenu } from "@/components/ActionMenu";
import { useConfirmation } from "@/components/ConfirmationModal";
import { StudentShell } from "@/components/StudentShell";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { paymentService } from "@/services/payment.service";
import type { Payment, PaymentStatus } from "@/lib/types";
import { formatApiDate } from "@/lib/date";

function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && "content" in data && Array.isArray((data as { content: unknown }).content)) {
    return (data as { content: T[] }).content;
  }
  return [];
}

const paymentStatusLabel: Record<PaymentStatus, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  CANCELLED: "Đã hủy",
  EXPIRED: "Đã hết hạn",
  FAILED: "Thất bại",
};

function paymentStatusClass(status: PaymentStatus) {
  if (status === "PAID") return "success";
  if (status === "PENDING") return "pending";
  return "danger";
}

export default function PaymentHistoryPage() {
  const { confirm } = useConfirmation();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingOrderCode, setCancellingOrderCode] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const cancellationRequestsRef = useRef(new Set<number>());

  const loadPayments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setPayments(normalizeList<Payment>(await paymentService.getMyPaymentHistory({
        page: 0,
        size: 100,
        sort: "createdDate,desc",
      })));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không tải được lịch sử thanh toán.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadPayments(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadPayments]);

  const cancelPayment = async (payment: Payment) => {
    if (!payment.providerOrderCode || cancellationRequestsRef.current.has(payment.providerOrderCode)) return;
    const accepted = await confirm({
      title: "Hủy thanh toán?",
      description: "Giao dịch đang chờ sẽ bị hủy và mã QR hoặc đường dẫn PayOS hiện tại sẽ không thể tiếp tục sử dụng.",
      confirmLabel: "Hủy thanh toán",
    });
    if (!accepted || cancellationRequestsRef.current.has(payment.providerOrderCode)) return;

    try {
      cancellationRequestsRef.current.add(payment.providerOrderCode);
      setCancellingOrderCode(payment.providerOrderCode);
      setActionError("");
      const updated = await paymentService.cancelPaymentByPayosOrderCode(payment.providerOrderCode);
      setPayments((current) => current.map((item) =>
        item.id === updated.id || item.providerOrderCode === updated.providerOrderCode ? updated : item
      ));
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : "Không hủy được giao dịch thanh toán.");
      await loadPayments();
    } finally {
      cancellationRequestsRef.current.delete(payment.providerOrderCode);
      setCancellingOrderCode(null);
    }
  };

  return (
    <AuthGate>
      <StudentShell>
        <section className="page-heading">
          <div>
            <span className="eyebrow">Billing</span>
            <h1>Lịch sử thanh toán</h1>
            <p>Theo dõi toàn bộ giao dịch, bao gồm cả các thanh toán đang chờ hoàn tất.</p>
          </div>
        </section>

        {actionError && <div className="form-error payment-history-error">{actionError}</div>}

        {loading ? <div className="loading-card">Đang tải lịch sử thanh toán...</div> : error ? <ErrorState message={error} onRetry={loadPayments} /> : payments.length === 0 ? (
          <EmptyState title="Chưa có giao dịch" description="Các giao dịch sẽ xuất hiện tại đây khi bạn bắt đầu thanh toán khóa học." action={{ label: "Xem khóa học", href: "/courses" }} />
        ) : (
          <section className="table-card payment-history-table-wrap">
            <table className="data-table payment-history-table">
              <thead><tr><th>Giao dịch</th><th>Khóa học</th><th>Số tiền</th><th>Nhà cung cấp</th><th>Trạng thái</th><th>Thời gian</th><th>Thao tác</th></tr></thead>
              <tbody>
                {payments.map((payment, index) => (
                  <tr key={payment.id || payment.providerOrderCode || `${payment.courseId}-${index}`}>
                    <td>
                      <strong>{payment.invoiceCode || (payment.providerOrderCode ? `#${payment.providerOrderCode}` : "—")}</strong>
                      {payment.invoiceCode && payment.providerOrderCode && <small>Đơn #{payment.providerOrderCode}</small>}
                    </td>
                    <td><span className="payment-course-id">{payment.courseId}</span></td>
                    <td><strong>{Number(payment.amount || 0).toLocaleString("vi-VN")}đ</strong></td>
                    <td>{payment.provider || "—"}</td>
                    <td><span className={`status-badge ${paymentStatusClass(payment.status)}`}>{paymentStatusLabel[payment.status] || payment.status}</span></td>
                    <td>{formatApiDate(payment.paidAt || payment.displayDate || payment.createdAt || payment.createdDate, payment.providerOrderCode)}</td>
                    <td>
                      <ActionMenu items={[
                        ...(payment.status === "PENDING" && payment.providerOrderCode ? [
                          { label: "Tiếp tục thanh toán", href: `/payment/checkout?orderCode=${payment.providerOrderCode}`, icon: <CreditCard size={16} /> },
                          {
                            label: cancellingOrderCode === payment.providerOrderCode ? "Đang hủy..." : "Hủy thanh toán",
                            icon: <Ban size={16} />,
                            danger: true,
                            disabled: cancellingOrderCode === payment.providerOrderCode,
                            onClick: () => void cancelPayment(payment),
                          },
                        ] : []),
                        ...(payment.id ? [{ label: "Xem chi tiết", href: `/payment/history/${payment.id}`, icon: <ReceiptText size={16} /> }] : []),
                      ]} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </StudentShell>
    </AuthGate>
  );
}
