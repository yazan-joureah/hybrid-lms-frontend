// src/pages/VerifyCertificate.tsx
import { useEffect, useState } from 'react'
import { useNav } from '../context/NavContext'
import EdujarLogo from '../components/EdujarLogo'
import { certService, type VerifyCertificateResponse } from '../services/certService'

interface Props {
    certificateId: string
}

export default function VerifyCertificate({ certificateId }: Props) {
    const { navigate } = useNav()
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [result, setResult] = useState<VerifyCertificateResponse | null>(null)

    useEffect(() => {
        certService.verifyCertificate(certificateId)
            .then(setResult)
            .catch(() => setError('تعذّر الاتصال بخادم التحقق. حاول مجددًا لاحقًا.'))
            .finally(() => setLoading(false))
    }, [certificateId])

    const handleDownloadBadge = () => {
        if (result?.credential_jwt && result.certificate) {
            certService.downloadBadgeJwtFile(
                `verified-${result.certificate.certificate_id}.badge.json`,
                result.credential_jwt
            )
        }
    }

    return (
        <div style={{
            minHeight: '100vh', direction: 'rtl',
            background: 'linear-gradient(135deg, #080320 0%, #1a0550 40%, #0d0340 100%)',
            display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
        }}>
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                <div style={{ position: 'absolute', top: '15%', right: '10%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)' }} />
            </div>

            <div style={{ padding: '20px 28px', position: 'relative', zIndex: 1 }}>
                <button onClick={() => navigate('landing')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    <EdujarLogo width={130} height={34} />
                </button>
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px', position: 'relative', zIndex: 1 }}>
                <div style={{
                    width: '100%', maxWidth: 460,
                    background: 'rgba(16,6,52,0.85)', backdropFilter: 'blur(28px)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24,
                    padding: '40px 36px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)', textAlign: 'center',
                }}>
                    {loading && (
                        <>
                            <div style={{ fontSize: 36, marginBottom: 16 }}>⏳</div>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>جارٍ التحقق من صحة الشهادة عبر EdDSA...</p>
                        </>
                    )}

                    {!loading && error && (
                        <>
                            <div style={{ fontSize: 44, marginBottom: 14 }}>⚠️</div>
                            <h1 style={{ fontSize: 19, fontWeight: 800, margin: '0 0 8px' }}>تعذّر التحقق</h1>
                            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.55)' }}>{error}</p>
                        </>
                    )}

                    {!loading && !error && result?.status === 'valid' && result.certificate && (
                        <>
                            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, margin: '0 auto 16px' }}>✓</div>
                            <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 4px' }}>الشهادة صحيحة وموثّقة</h1>
                            <p style={{ fontSize: 12, color: '#34d399', fontWeight: 600, marginBottom: 22 }}>موقّعة بمعيار Ed25519 (EdDSA)</p>

                            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 14, padding: '18px', textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                                <div>
                                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>اسم الطالب</div>
                                    <div style={{ fontSize: 14.5, fontWeight: 700 }}>{result.certificate.student_name}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>الكورس المُكتمل</div>
                                    <div style={{ fontSize: 14.5, fontWeight: 700 }}>{result.certificate.course_title}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>تاريخ الإصدار</div>
                                    <div style={{ fontSize: 13.5 }}>{new Date(result.certificate.issued_at).toLocaleDateString('ar')}</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', marginBottom: 3 }}>رقم الشهادة</div>
                                    <div style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.6)' }}>{result.certificate.certificate_id}</div>
                                </div>
                            </div>

                            {result.credential_jwt && (
                                <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14 }} onClick={handleDownloadBadge}>
                                    ⬇ تصدير Verifiable Credential (VC-JWT)
                                </button>
                            )}
                        </>
                    )}

                    {!loading && !error && result?.status === 'revoked' && result.certificate && (
                        <>
                            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 16px' }}>🚫</div>
                            <h1 style={{ fontSize: 19, fontWeight: 800, margin: '0 0 8px' }}>هذه الشهادة مُلغاة</h1>
                            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>
                                تم استبدالها بشهادة جديدة (غالبًا بسبب تحديث اسم الطالب).
                            </p>
                            {result.certificate.superseded_by && (
                                <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 11.5, fontFamily: 'monospace', color: '#fbbf24' }}>
                                    الشهادة الجديدة: {result.certificate.superseded_by}
                                </div>
                            )}
                        </>
                    )}

                    {!loading && !error && result?.status === 'not_found' && (
                        <>
                            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 16px' }}>✕</div>
                            <h1 style={{ fontSize: 19, fontWeight: 800, margin: '0 0 8px' }}>الشهادة غير موجودة</h1>
                            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.55)' }}>لا توجد شهادة بهذا المعرّف في سجلاتنا.</p>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}