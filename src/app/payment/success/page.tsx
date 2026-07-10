"use client";

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AuthGate } from "@/components/AuthGate";
import { StudentShell } from "@/components/StudentShell";
import { CheckCircle2 } from "lucide-react";
import { paymentService } from "@/services/payment.service";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderCode = searchParams.get("orderCode");
  const [message, setMessage] = useState("Đang kiểm tra trạng thái thanh toán...");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let attempts = 0;
    const poll = async () => {
      if (!orderCode) {
        setMessage("Không tìm thấy mã giao dịch để xác nhận.");
        return;
      }

      attempts += 1;
      try {
        const payment = await paymentService.syncPaymentByPayosOrderCode(orderCode);
        if (cancelled) return;
        if (payment.status === "PAID") {
          setConfirmed(true);
          setMessage("Thanh toán đã được xác nhận và khóa học đã được thêm vào tài khoản của bạn.");
          return;
        }
        setMessage("Đang chờ ngân hàng xác nhận giao dịch...");
      } catch {
        if (!cancelled) {
          setMessage("Đang chờ backend nhận xác nhận từ PayOS...");
        }
      }

      if (!cancelled && attempts < 10) {
        timer = setTimeout(poll, 1500);
      } else if (!cancelled) {
        setMessage("Nếu khóa học chưa hiện ngay, hãy mở lại sau vài giây.");
      }
    };

    poll();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderCode]);

  return (
    <AuthGate>
      <StudentShell>
        <section className="page-heading">
          <div>
            <span className="eyebrow">Thanh toán</span>
            <h1>Thanh toán thành công</h1>
            <p>{message}</p>
          </div>
        </section>

        <section className="empty-state">
          <CheckCircle2 size={56} color={confirmed ? "var(--success)" : "var(--muted)"} />
          <h2>{confirmed ? "Bạn có thể bắt đầu học rồi" : "Đang hoàn tất ghi danh"}</h2>
          <p>{confirmed
            ? "Giao dịch đã được xác nhận và khóa học đã có trong tài khoản của bạn."
            : "Vui lòng giữ nguyên trang này trong khi EduFlow đối soát giao dịch."}</p>
          {confirmed && (
            <Link className="primary-button" href="/my-courses">
              Xem khóa học của tôi
            </Link>
          )}
        </section>
      </StudentShell>
    </AuthGate>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={null}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
