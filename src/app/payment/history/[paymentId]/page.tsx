"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CalendarClock, CheckCircle2, Clock3, CreditCard, FileText, GraduationCap, Hash, Landmark, ReceiptText, ShieldCheck, XCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { ErrorState } from "@/components/ErrorState";
import { StudentShell } from "@/components/StudentShell";
import type { Course, Payment, PaymentStatus } from "@/lib/types";
import { formatApiDate } from "@/lib/date";
import { courseService } from "@/services/course.service";
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

const statusDescription: Record<PaymentStatus, string> = {
  PENDING: "Giao dịch đang chờ bạn hoàn tất thanh toán.",
  PAID: "Thanh toán đã được xác nhận thành công.",
  CANCELLED: "Giao dịch đã được hủy theo yêu cầu.",
  EXPIRED: "Giao dịch đã quá thời hạn thanh toán 24 giờ.",
  FAILED: "Giao dịch không thể hoàn tất.",
};

export default function PaymentDetailPage() {
  const params = useParams<{ paymentId: string }>();
  const [payment, setPayment] = useState<Payment | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPayment = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const nextPayment = await paymentService.getPayment(params.paymentId);
      setPayment(nextPayment);
      try {
        setCourse(await courseService.getCourse(nextPayment.courseId));
      } catch {
        setCourse(null);
      }
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
            <aside className="payment-detail-sidebar">
              <article className={`card payment-receipt-summary ${statusClass(payment.status)}`}>
                <div className="payment-receipt-icon"><ReceiptText size={25} /></div>
                <span className="eyebrow">Tổng thanh toán</span>
                <strong className="payment-detail-total">{Number(payment.amount || 0).toLocaleString("vi-VN")}đ</strong>
                <div className="payment-receipt-divider" />
                <div className="payment-status-line">
                  {payment.status === "PAID" ? <CheckCircle2 size={20} /> : payment.status === "PENDING" ? <Clock3 size={20} /> : <XCircle size={20} />}
                  <div><strong>{statusLabel[payment.status]}</strong><span>{statusDescription[payment.status]}</span></div>
                </div>
                {payment.status === "PENDING" && payment.providerOrderCode && (
                  <Link className="primary-button" href={`/payment/checkout?orderCode=${payment.providerOrderCode}`}>
                    <CreditCard size={17} /> Tiếp tục thanh toán
                  </Link>
                )}
              </article>
              <div className="payment-safe-note"><ShieldCheck size={18} /><span>Thông tin giao dịch được bảo vệ và đối soát qua PayOS.</span></div>
            </aside>

            <article className="card p-6 payment-detail-card">
              <div className="payment-detail-section-heading">
                <div><span className="eyebrow">Hóa đơn điện tử</span><h2>Thông tin giao dịch</h2></div>
                <span className="payment-invoice-chip">{payment.invoiceCode || "Chưa phát hành"}</span>
              </div>
              <div className="payment-course-block">
                <div className="payment-course-icon"><GraduationCap size={22} /></div>
                <div><span>Khóa học</span><strong>{course?.name || "Khóa học đã đăng ký"}</strong><small>{course?.code || payment.courseId}</small></div>
                <Link href={`/courses/${payment.courseId}`}>Xem khóa học</Link>
              </div>
              <div className="payment-detail-list">
                <div className="payment-detail-row"><span><FileText size={16} /> Mã hóa đơn</span><strong>{payment.invoiceCode || "—"}</strong></div>
                <div className="payment-detail-row"><span><Hash size={16} /> Mã đơn hàng</span><strong>{payment.providerOrderCode ? `#${payment.providerOrderCode}` : "—"}</strong></div>
                <div className="payment-detail-row"><span><Landmark size={16} /> Cổng thanh toán</span><strong>{payment.provider || "—"}</strong></div>
                <div className="payment-detail-row"><span><CalendarClock size={16} /> Thời gian tạo</span><strong>{formatApiDate(payment.createdAt || payment.createdDate || payment.displayDate, payment.providerOrderCode)}</strong></div>
                <div className="payment-detail-row"><span><CalendarClock size={16} /> Thời gian thanh toán</span><strong>{formatApiDate(payment.paidAt)}</strong></div>
                <div className="payment-detail-row"><span><Hash size={16} /> Mã giao dịch</span><strong>{payment.providerTransactionId || "—"}</strong></div>
              </div>
            </article>
          </section>
        ) : null}
      </StudentShell>
    </AuthGate>
  );
}
