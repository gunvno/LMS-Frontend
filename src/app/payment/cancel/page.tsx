"use client";

import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { StudentShell } from "@/components/StudentShell";
import { XCircle } from "lucide-react";

export default function PaymentCancelPage() {
  return (
    <AuthGate>
      <StudentShell>
        <section className="page-heading">
          <div>
            <span className="eyebrow">Thanh toán</span>
            <h1>Thanh toán đã hủy</h1>
            <p>Bạn có thể quay lại khóa học để tạo lại yêu cầu thanh toán khi sẵn sàng.</p>
          </div>
        </section>

        <section className="empty-state">
          <XCircle size={56} color="var(--danger)" />
          <h2>Giao dịch chưa hoàn tất</h2>
          <p>Khóa học sẽ chỉ được thêm vào tài khoản sau khi thanh toán thành công.</p>
          <Link className="primary-button" href="/courses">
            Quay lại khóa học
          </Link>
        </section>
      </StudentShell>
    </AuthGate>
  );
}
