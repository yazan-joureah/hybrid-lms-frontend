// src/components/cert/CertificateViewModal.tsx
import type { DownloadCertificateData } from '../../services/certService'
import { certService } from '../../services/certService'
import './certificate-print.css'

interface Props {
    isOpen: boolean
    data: DownloadCertificateData | null
    onClose: () => void
}

export function CertificateViewModal({ isOpen, data, onClose }: Props) {
    if (!isOpen || !data) return null

    const handleDownloadBadge = () => {
        if (!data.credential_jwt) return
        certService.downloadBadgeJwtFile(`certificate-${data.certificate_id}.badge.json`, data.credential_jwt)
    }

    const formattedDate = new Date(data.issued_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    })

    return (
        <>
            {/* 1. ON-SCREEN MODAL PREVIEW */}
            <div
                className="hide-on-print"
                style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: 16 }}
                onClick={onClose}
            >
                <div
                    onClick={e => e.stopPropagation()}
                    style={{ background: 'rgba(12,4,45,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 22, padding: '32px', maxWidth: 460, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                        <div>
                            <span style={{ fontSize: 11, color: '#38bdf8', fontWeight: 700, letterSpacing: 1 }}>HYBRID LMS</span>
                            <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>شهادة الإتمام</h3>
                        </div>
                        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: '50%', width: 30, height: 30, color: '#fff', cursor: 'pointer', fontSize: 14 }}>✕</button>
                    </div>

                    <div style={{
                        background: 'linear-gradient(135deg, rgba(124,58,237,0.4) 0%, rgba(6,182,212,0.2) 100%)',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '28px 22px', textAlign: 'center', marginBottom: 20,
                    }}>
                        <div style={{ fontSize: 36, marginBottom: 10 }}>🎓</div>
                        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>شهادة إتمام معتمدة — Hybrid LMS</div>
                        <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 6 }}>{data.course_title}</div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{data.student_name}</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                        {[
                            ['🏛️ منصة التدريب', 'Hybrid LMS'],
                            ['📅 تاريخ الإصدار', new Date(data.issued_at).toLocaleDateString('ar')],
                            ['🔖 رقم الشهادة', data.certificate_id],
                        ].map(([l, v]) => (
                            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5 }}>
                                <span style={{ color: 'rgba(255,255,255,0.5)' }}>{l}</span>
                                <span style={{ fontWeight: 500, fontFamily: l.includes('رقم') ? 'monospace' : 'inherit', fontSize: l.includes('رقم') ? 11 : 12.5 }}>{v}</span>
                            </div>
                        ))}
                    </div>

                    {data.qr_code_image_base64 && (
                        <div style={{ textAlign: 'center', marginBottom: 20 }}>
                            <img
                                src={`data:image/png;base64,${data.qr_code_image_base64}`}
                                alt="QR Code"
                                style={{ width: 140, height: 140, borderRadius: 12, background: '#fff', padding: 8 }}
                            />
                            <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>امسح الرمز للتحقق عبر Hybrid LMS</div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: 10 }}>
                        <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '10px', fontSize: 13.5 }} onClick={() => window.print()}>
                            🖨️ طباعة / حفظ PDF
                        </button>
                        {data.credential_jwt && (
                            <button className="btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '10px', fontSize: 13.5 }} onClick={handleDownloadBadge}>
                                ⬇ Open Badge (.json)
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* 2. COURSERA-STYLE MODERN CERTIFICATE (PRINT ONLY) */}
            {/* Added dir="ltr" to strictly prevent Arabic layout inheritance */}
            <div id="printable-certificate" dir="ltr">
                <div className="cert-coursera-container">

                    {/* Header */}
                    <div className="cert-header">
                        <div className="cert-brand">
                            <span className="cert-brand-logo">Hybrid LMS</span>
                            <span className="cert-brand-sub">Online Learning Platform</span>
                        </div>
                        <div className="cert-type-badge">Course Certificate</div>
                    </div>

                    {/* Main Content */}
                    <div className="cert-body">
                        <div className="cert-date-text">{formattedDate}</div>
                        <h1 className="cert-student-name">{data.student_name}</h1>
                        <div className="cert-completion-lead">has successfully completed</div>
                        <h2 className="cert-course-name">{data.course_title}</h2>
                        <p className="cert-disclaimer">
                            an online non-credit course authorized by <strong>Hybrid LMS</strong> and offered through the Hybrid LMS online learning platform.
                        </p>
                    </div>

                    {/* Footer */}
                    <div className="cert-footer-modern">
                        <div className="cert-meta-group">
                            <div className="cert-meta-item">
                                <span className="cert-meta-label">Certificate ID</span>
                                <span className="cert-meta-val">{data.certificate_id}</span>
                            </div>
                            <div className="cert-meta-item">
                                <span className="cert-meta-label">Issued By</span>
                                <span className="cert-meta-val" style={{ fontFamily: 'inherit' }}>Hybrid LMS Team</span>
                            </div>
                        </div>

                        {data.qr_code_image_base64 && (
                            <div className="cert-verify-block">
                                <div className="cert-verify-text">
                                    Verify online credential authenticity
                                </div>
                                <img
                                    src={`data:image/png;base64,${data.qr_code_image_base64}`}
                                    alt="QR Code"
                                    className="cert-qr-img"
                                />
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </>
    )
}