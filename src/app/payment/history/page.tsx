"use client";

import { useEffect, useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { StudentShell } from "@/components/StudentShell";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { paymentService } from "@/services/payment.service";
import type { Invoice } from "@/lib/types";

function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && "content" in data && Array.isArray((data as { content: unknown }).content)) {
    return (data as { content: T[] }).content;
  }
  return [];
}

function formatPaymentDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function PaymentHistoryPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadInvoices = async () => {
    setLoading(true);
    setError("");
    try {
      setInvoices(normalizeList<Invoice>(await paymentService.getMyInvoices()));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không tải được lịch sử thanh toán.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInvoices(); }, []);

  return (
    <AuthGate>
      <StudentShell>
        <section className="page-heading">
          <div>
            <span className="eyebrow">Billing</span>
            <h1>Lịch sử thanh toán</h1>
            <p>Tra cứu các giao dịch đã thanh toán và hóa đơn của bạn.</p>
          </div>
        </section>

        {loading ? <div className="loading-card">Đang tải lịch sử thanh toán...</div> : error ? <ErrorState message={error} onRetry={loadInvoices} /> : invoices.length === 0 ? (
          <EmptyState title="Chưa có hóa đơn" description="Các hóa đơn sẽ xuất hiện sau khi bạn thanh toán khóa học." action={{ label: "Xem khóa học", href: "/courses" }} />
        ) : (
          <section className="table-card payment-history-table-wrap">
            <table className="data-table payment-history-table">
              <thead><tr><th>Mã hóa đơn</th><th>Số tiền</th><th>Nhà cung cấp</th><th>Trạng thái</th><th>Ngày thanh toán</th></tr></thead>
              <tbody>
                {invoices.map((invoice) => (
                  <tr key={invoice.id}>
                    <td><strong>{invoice.invoiceCode}</strong><small>{invoice.courseId}</small></td>
                    <td>{invoice.amount.toLocaleString("vi-VN")}đ</td>
                    <td>{invoice.provider}</td>
                    <td><span className="status-badge success">{invoice.status === "PAID" ? "Đã thanh toán" : invoice.status}</span></td>
                    <td>{formatPaymentDate(invoice.paidAt || invoice.issuedAt)}</td>
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
