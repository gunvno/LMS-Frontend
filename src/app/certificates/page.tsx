"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AuthGate } from "@/components/AuthGate";
import { StudentShell } from "@/components/StudentShell";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { useToast } from "@/components/Toast";
import { learningService } from "@/services/learning.service";
import type { Certificate } from "@/lib/types";
import { Award, Search } from "lucide-react";

function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === "object" && "content" in data && Array.isArray((data as { content: unknown }).content))
    return (data as { content: T[] }).content;
  return [];
}

const statusLabels: Record<string, { label: string; className: string }> = {
  ISSUED: { label: "Đã cấp", className: "status-active" },
  REVOKED: { label: "Đã thu hồi", className: "status-revoked" },
};

export default function CertificatesPage() {
  const toast = useToast();
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [verifyResult, setVerifyResult] = useState<Certificate | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await learningService.getMyCertificates();
      setCertificates(normalizeList<Certificate>(data));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Không tải được chứng chỉ.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchData(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const verifyCertificate = async () => {
    if (!verifyCode.trim()) return;
    setVerifying(true);
    setVerifyError("");
    setVerifyResult(null);
    try {
      const result = await learningService.verifyCertificate(verifyCode.trim());
      setVerifyResult(result);
      toast.success("Đã tìm thấy chứng chỉ.");
    } catch (err: unknown) {
      setVerifyError(err instanceof Error ? err.message : "Không tìm thấy chứng chỉ với mã này.");
    } finally {
      setVerifying(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return Number.isFinite(date.getTime()) ? date.toLocaleDateString("vi-VN") : "—";
  };

  return (
    <AuthGate>
      <StudentShell>
        <section className="page-heading">
          <div>
            <span className="eyebrow">Chứng chỉ</span>
            <h1>Chứng chỉ đã cấp</h1>
            <p>Tra cứu và xác minh chứng chỉ theo mã certificate code.</p>
          </div>
        </section>

        {loading ? (
          <div style={{ textAlign: "center", padding: 40, color: "var(--muted)" }}>
            Đang tải chứng chỉ...
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchData} />
        ) : (
          <section className="certificate-layout">
            <div className="certificate-grid">
              {certificates.length === 0 ? (
                <EmptyState
                  title="Chưa có chứng chỉ nào"
                  description="Hoàn thành khóa học và quiz bắt buộc để nhận chứng chỉ."
                  icon={<Award size={48} />}
                  action={{ label: "Xem khóa học", href: "/courses" }}
                />
              ) : (
                certificates.map((cert) => {
                  const status = statusLabels[cert.status] || { label: cert.status, className: "" };
                  return (
                    <article className="certificate-panel" key={cert.id || cert.certificateCode}>
                      <span className="eyebrow">EduFlow Certificate</span>
                      <h2>{cert.courseName || "Chứng chỉ"}</h2>
                      <p>Mã chứng chỉ</p>
                      <div className="certificate-code">{cert.certificateCode}</div>
                      <div className="certificate-meta">
                        <span>Cấp ngày: {formatDate(cert.issuedAt)}</span>
                        {cert.expiresAt && <span>Hết hạn: {formatDate(cert.expiresAt)}</span>}
                        <strong className={status.className}>{status.label}</strong>
                      </div>
                      <Link
                        href={`/certificates/${cert.certificateCode}`}
                        className="ghost-button"
                        style={{ marginTop: 14 }}
                      >
                        Xem chi tiết
                      </Link>
                    </article>
                  );
                })
              )}
            </div>

            <aside className="verify-card">
              <h2><Search size={20} style={{ marginRight: 6 }} /> Tra cứu chứng chỉ</h2>
              <p>Nhập mã chứng chỉ để kiểm tra trạng thái hiệu lực.</p>
              <input
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value)}
                placeholder="Nhập mã chứng chỉ..."
              />
              <button
                className="primary-button full-button"
                onClick={verifyCertificate}
                disabled={verifying || !verifyCode.trim()}
              >
                {verifying ? "Đang tra cứu..." : "Xác minh"}
              </button>
              {verifyError && (
                <div className="form-error" style={{ marginTop: 12 }}>
                  {verifyError}
                </div>
              )}
              {verifyResult && (
                <div className="verify-result">
                  <strong>{verifyResult.courseName || "Chứng chỉ"}</strong>
                  <span>Mã: {verifyResult.certificateCode}</span>
                  <span>Cấp: {formatDate(verifyResult.issuedAt)}</span>
                  <span className={statusLabels[verifyResult.status]?.className || ""}>
                    {statusLabels[verifyResult.status]?.label || verifyResult.status}
                  </span>
                </div>
              )}
            </aside>
          </section>
        )}
      </StudentShell>
    </AuthGate>
  );
}
