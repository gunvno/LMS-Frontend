"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarClock, CreditCard, FileText, GraduationCap, Hash, Landmark } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { ErrorState } from "@/components/ErrorState";
import { StudentShell } from "@/components/StudentShell";
import type { Payment, PaymentStatus } from "@/lib/types";
import { formatApiDate } from "@/lib/date";
import { paymentService } from "@/services/payment.service";

const statusLabel: Record<PaymentStatus, string> = {
  PENDING: "Chờ thanh toán",
  PAID: "Đã thanh toán",
  CANCELLED: "Đã hủy",
  EXPIRED: "Đã hết hạn",
  FAILED: "Thất bại",
};

function statusClass(status: PaymentStatus) {
  if (status === "PAID") return "success";
  if (status === "PENDING") return "pending";
  return "danger";
}

export default function PaymentDetailPage() {
  const params = useParams<{ paymentId: string }>();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPayment = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setPayment(await paymentService.getPayment(params.paymentId));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không tải được chi tiết giao dịch.");
    } finally {
      setLoading(false);
    }
  }, [params.paymentId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => void loadPayment(), 0);
    return () => window.clearTimeout(timeoutId);
  }, [loadPayment]);

  return (
    <AuthGate>
      <StudentShell>
        <section className="page-heading payment-detail-heading">
          <div>
            <Link href="/payment/history" className="text-link payment-back-link"><ArrowLeft size={16} /> Lịch sử thanh toán</Link>
            <span className="eyebrow">Billing</span>
            <h1>Chi tiết giao dịch</h1>
            <p>Thông tin thanh toán và hóa đơn của khóa học.</p>
          </div>
          {payment && <span className={`status-badge ${statusClass(payment.status)}`}>{statusLabel[payment.status]}</span>}
        </section>

        {loading ? <div className="loading-card">Đang tải chi tiết giao dịch...</div> : error ? (
          <ErrorState message={error} onRetry={loadPayment} />
        ) : payment ? (
          <section className="payment-detail-layout">
            <article className="card p-6 payment-detail-summary">
              <span className="eyebrow">Số tiền</span>
              <strong className="payment-detail-total">{Number(payment.amount || 0).toLocaleString("vi-VN")}đ</strong>
              {payment.status === "PENDING" && payment.providerOrderCode && (
                <Link className="primary-button" href={`/payment/checkout?orderCode=${payment.providerOrderCode}`}>
                  <CreditCard size={17} /> Tiếp tục thanh toán
                </Link>
              )}
            </article>

            <article className="card p-6 payment-detail-card">
              <div className="payment-detail-row"><span><FileText size={16} /> Mã hóa đơn</span><strong>{payment.invoiceCode || "—"}</strong></div>
              <div className="payment-detail-row"><span><Hash size={16} /> Mã đơn hàng</span><strong>{payment.providerOrderCode ? `#${payment.providerOrderCode}` : "—"}</strong></div>
              <div className="payment-detail-row"><span><GraduationCap size={16} /> Khóa học</span><strong>{payment.courseId}</strong></div>
              <div className="payment-detail-row"><span><Landmark size={16} /> Nhà cung cấp</span><strong>{payment.provider || "—"}</strong></div>
              <div className="payment-detail-row"><span><CalendarClock size={16} /> Thời gian tạo</span><strong>{formatApiDate(payment.createdAt || payment.createdDate || payment.displayDate, payment.providerOrderCode)}</strong></div>
              <div className="payment-detail-row"><span><CalendarClock size={16} /> Thời gian thanh toán</span><strong>{formatApiDate(payment.paidAt)}</strong></div>
              <div className="payment-detail-row"><span><Hash size={16} /> Mã giao dịch</span><strong>{payment.providerTransactionId || "—"}</strong></div>
            </article>
          </section>
        ) : null}
      </StudentShell>
    </AuthGate>
  );
}
