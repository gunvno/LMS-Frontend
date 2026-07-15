"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { Ban, Check, Copy, LoaderCircle, ShieldCheck } from "lucide-react";
import { AuthGate } from "@/components/AuthGate";
import { useConfirmation } from "@/components/ConfirmationModal";
import { StudentShell } from "@/components/StudentShell";
import { paymentService } from "@/services/payment.service";
import type { Payment } from "@/lib/types";

function CheckoutContent() {
  const router = useRouter();
  const { confirm } = useConfirmation();
  const searchParams = useSearchParams();
  const orderCode = searchParams.get("orderCode");
  const [payment, setPayment] = useState<Payment | null>(null);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const cancellingRef = useRef(false);
  const displayError = error || (!orderCode ? "Không tìm thấy mã giao dịch thanh toán." : "");

  const cancelPayment = async () => {
    if (!payment?.providerOrderCode || cancellingRef.current) return;
    const accepted = await confirm({
      title: "Hủy thanh toán?",
      description: "Mã QR và đường dẫn thanh toán hiện tại sẽ bị vô hiệu hóa. Bạn cần tạo giao dịch mới nếu muốn mua khóa học sau này.",
      confirmLabel: "Hủy và quay lại",
    });
    if (!accepted || cancellingRef.current) return;

    cancellingRef.current = true;
    setCancelling(true);
    setError("");
    try {
      await paymentService.cancelPaymentByPayosOrderCode(payment.providerOrderCode);
      router.replace(`/courses/${payment.courseId}`);
    } catch (err: unknown) {
      const current = await paymentService
        .syncPaymentByPayosOrderCode(payment.providerOrderCode)
        .catch(() => null);
      if (current?.status === "PAID") {
        router.replace(`/payment/success?orderCode=${payment.providerOrderCode}`);
        return;
      }
      setError(err instanceof Error ? err.message : "Không hủy được giao dịch thanh toán.");
      cancellingRef.current = false;
      setCancelling(false);
    }
  };

  const copyTransferContent = async () => {
    if (!payment?.transferContent) return;
    await navigator.clipboard.writeText(payment.transferContent);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  useEffect(() => {
    if (!orderCode) return;

    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const checkPayment = async () => {
      if (stopped || cancellingRef.current) return;
      try {
        const current = await paymentService.syncPaymentByPayosOrderCode(orderCode);
        if (stopped || cancellingRef.current) return;
        setPayment(current);
        setError("");
        if (current.status === "PAID") {
          router.replace(`/payment/success?orderCode=${orderCode}`);
          return;
        }
        if (current.status === "EXPIRED") {
          setError("Mã QR đã hết hạn sau 24 giờ. Vui lòng quay lại khóa học để tạo giao dịch mới.");
          return;
        }
        if (current.status === "CANCELLED" || current.status === "FAILED") {
          router.replace(current.id ? `/payment/history/${current.id}` : "/payment/history");
          return;
        }
      } catch (err: unknown) {
        if (!stopped) {
          setError(err instanceof Error ? err.message : "Chưa kiểm tra được giao dịch.");
        }
      }

      if (!stopped) timer = setTimeout(checkPayment, 2000);
    };

    checkPayment();
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderCode, router]);

  return (
    <AuthGate>
      <StudentShell>
        <section className="page-heading">
          <div>
            <span className="eyebrow">Thanh toán khóa học</span>
            <h1>Quét mã để thanh toán</h1>
            <p>EduFlow sẽ tự xác nhận và chuyển sang trang thành công ngay khi ngân hàng ghi nhận giao dịch.</p>
          </div>
        </section>

        {!payment && !displayError && <section className="empty-state"><LoaderCircle className="spin" size={44} /></section>}

        {payment && payment.status === "PENDING" && <section className="payment-checkout-layout">
          <article className="card p-6 payment-qr-panel">
            <span className="payment-status-chip"><span /> Đang chờ thanh toán</span>
            <h2>Quét mã QR để thanh toán</h2>
            <p className="text-body-md text-on-surface-variant">Mở ứng dụng ngân hàng, quét mã bên dưới và kiểm tra thông tin trước khi xác nhận.</p>
            <div className="payment-qr-frame">
              {payment.providerQrCode ? <QRCodeSVG className="payment-qr-code" value={payment.providerQrCode} size={320} level="M" includeMargin /> : <p>Chưa tạo được mã QR. Vui lòng mở ứng dụng thanh toán.</p>}
            </div>
            <div className="payment-security-note"><ShieldCheck size={18} /> Mã có hiệu lực 24 giờ và được xác nhận tự động.</div>
          </article>

          <article className="card p-6 payment-details-card">
            <span className="eyebrow">Thông tin giao dịch</span>
            <div className="payment-amount"><span>Số tiền cần thanh toán</span><strong>{payment.amount.toLocaleString("vi-VN")}đ</strong></div>
            <div className="payment-detail-row"><span>Mã đơn hàng</span><strong>#{payment.providerOrderCode || "-"}</strong></div>
            <div className="payment-detail-row payment-transfer-row"><span>Nội dung chuyển khoản</span><strong>{payment.transferContent || "-"}</strong><button type="button" className="copy-button" onClick={copyTransferContent} disabled={!payment.transferContent} aria-label="Sao chép nội dung chuyển khoản">{copied ? <Check size={16}/> : <Copy size={16}/>} {copied ? "Đã sao chép" : "Sao chép"}</button></div>
            <div className="payment-waiting-note"><LoaderCircle className="spin" size={18} /> Hệ thống đang tự động kiểm tra thanh toán</div>
            <button type="button" className="payment-cancel-button" onClick={() => void cancelPayment()} disabled={cancelling}>
              {cancelling ? <LoaderCircle className="spin" size={17} /> : <Ban size={17} />}
              {cancelling ? "Đang hủy thanh toán..." : "Hủy và quay lại khóa học"}
            </button>
          </article>
        </section>}

        {displayError && <section className="error-state">
          <div className="form-error">{displayError}</div>
          <Link className="ghost-button" href="/courses">Quay lại khóa học</Link>
        </section>}
      </StudentShell>
    </AuthGate>
  );
}

export default function PaymentCheckoutPage() {
  return (
    <Suspense fallback={null}>
      <CheckoutContent />
    </Suspense>
  );
}
