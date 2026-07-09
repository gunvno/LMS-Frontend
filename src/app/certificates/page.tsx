"use client";

import { useState } from "react";
import { AuthGate } from "@/components/AuthGate";
import { StudentShell } from "@/components/StudentShell";
import { certificates } from "@/lib/student-data";

export default function CertificatesPage() {
  const [code, setCode] = useState("LMS-2026-A91F3C7B");

  return (
    <AuthGate>
      {(session) => (
        <StudentShell session={session}>
          <section className="page-heading">
            <div>
              <span className="eyebrow">Chứng chỉ</span>
              <h1>Chứng chỉ đã cấp</h1>
              <p>Tra cứu và xác minh chứng chỉ theo mã certificate code.</p>
            </div>
          </section>

          <section className="certificate-layout">
            <div className="certificate-grid">
              {certificates.map((certificate) => (
                <article className="certificate-panel" key={certificate.code}>
                  <span className="eyebrow">EduFlow Certificate</span>
                  <h2>{certificate.title}</h2>
                  <p>Mã chứng chỉ</p>
                  <div className="certificate-code">{certificate.code}</div>
                  <div className="certificate-meta">
                    <span>Cấp ngày: {certificate.issuedAt}</span>
                    <span>Hết hạn: {certificate.expiresAt}</span>
                    <strong>{certificate.status}</strong>
                  </div>
                </article>
              ))}
            </div>

            <aside className="verify-card">
              <h2>Tra cứu chứng chỉ</h2>
              <p>Nhập mã chứng chỉ để kiểm tra trạng thái hiệu lực.</p>
              <input value={code} onChange={(event) => setCode(event.target.value)} />
              <button className="primary-button full-button">Xác minh</button>
              <small>Kết quả sẽ gọi API `/api/v1/certificates/{code}` khi nối backend.</small>
            </aside>
          </section>
        </StudentShell>
      )}
    </AuthGate>
  );
}
