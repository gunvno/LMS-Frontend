"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { PublicNav } from "@/components/PublicNav";
import { ErrorState } from "@/components/ErrorState";
import { learningService } from "@/services/learning.service";
import type { Certificate } from "@/lib/types";
import { Award, CheckCircle, XCircle } from "lucide-react";

const statusLabels: Record<string, { label: string; icon: React.ReactNode }> = {
  ACTIVE: { label: "Còn hiệu lực", icon: <CheckCircle size={20} color="var(--success)" /> },
  EXPIRED: { label: "Hết hạn", icon: <XCircle size={20} color="var(--warning)" /> },
  REVOKED: { label: "Đã thu hồi", icon: <XCircle size={20} color="var(--danger)" /> },
};

export default function CertificateVerifyPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    learningService
      .verifyCertificate(code)
      .then(setCertificate)
      .catch((err: unknown) => {
        setError(
          err instanceof Error ? err.message : "Không tìm thấy chứng chỉ với mã này."
        );
      })
      .finally(() => setLoading(false));
  }, [code]);

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    const date = new Date(dateStr);
    return Number.isFinite(date.getTime()) ? date.toLocaleDateString("vi-VN") : "—";
  };

  return (
    <PublicNav>
      <section style={{ maxWidth: 600, margin: "60px auto", padding: "0 20px" }}>
        {loading ? (
          <div className="loading-card" style={{ margin: "0 auto" }}>
            <span className="brand-symbol">E</span>
            <strong>Đang tra cứu chứng chỉ...</strong>
          </div>
        ) : error ? (
          <ErrorState
            title="Không tìm thấy"
            message={error}
          />
        ) : certificate ? (
          <div className="certificate-panel" style={{ textAlign: "center" }}>
            <Award size={48} color="var(--primary)" />
            <span className="eyebrow" style={{ marginTop: 16 }}>EduFlow Certificate</span>
            <h1 style={{ fontSize: 32, margin: "12px 0 8px" }}>{certificate.courseName || "Chứng chỉ"}</h1>
            {certificate.userName && <p style={{ color: "var(--muted)" }}>Cấp cho: {certificate.userName}</p>}
            <div className="certificate-code">{certificate.certificateCode}</div>
            <div className="certificate-meta" style={{ justifyContent: "center" }}>
              <span>Cấp ngày: {formatDate(certificate.issuedAt)}</span>
              {certificate.expiresAt && <span>Hết hạn: {formatDate(certificate.expiresAt)}</span>}
            </div>
            <div style={{ marginTop: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
              {statusLabels[certificate.status]?.icon}
              <strong>{statusLabels[certificate.status]?.label || certificate.status}</strong>
            </div>
            <Link href="/certificates" className="ghost-button" style={{ marginTop: 24 }}>
              Xem tất cả chứng chỉ
            </Link>
          </div>
        ) : null}
      </section>
    </PublicNav>
  );
}
