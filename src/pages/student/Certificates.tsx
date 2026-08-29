// src/pages/student/Certificates.tsx
import { useState } from 'react'
import { useNav } from '../../context/NavContext'
import { useMyCertificates } from '../../hooks/cert/useMyCertificates'
import { CertificateViewModal } from '../../components/cert/CertificateViewModal'
import { certService, type DownloadCertificateData, type MyCertificateItem } from '../../services/certService'
import { SkeletonLoader } from '../../components/common/Loading'

const KYC_CONFIG = {
  verified: { label: 'موثّق ✓', color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', icon: '🛡️', desc: 'هويتك موثّقة. يمكنك تحميل شهاداتك وعرضها رسمياً.' },
  review_pending: { label: 'قيد المراجعة', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', icon: '⏳', desc: 'جارٍ مراجعة هويتك. لن تُصدَر شهاداتك تلقائياً إلا بعد اكتمال التحقق.' },
  rejected: { label: 'مرفوض', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', icon: '❌', desc: 'تم رفض طلب التحقق. يرجى إعادة رفع المستندات من صفحة الملف الشخصي.' },
  not_submitted: { label: 'غير مكتمل', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', icon: '⚠️', desc: 'يجب توثيق هويتك (KYC) أولاً حتى تُصدَر لك الشهادات عند إكمال الكورسات.' },
} as const

export default function Certificates() {
  const { kycStatus, navigate } = useNav()
  const { activeCertificates, loading, error, refetch } = useMyCertificates()

  const [viewData, setViewData] = useState<DownloadCertificateData | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [openingCourseId, setOpeningCourseId] = useState<string | null>(null)

  const kyc = KYC_CONFIG[(kycStatus as keyof typeof KYC_CONFIG) || 'not_submitted'] || KYC_CONFIG.not_submitted

  const handleOpenCertificate = async (cert: MyCertificateItem) => {
    setOpeningCourseId(cert.course_id)
    try {
      const data = await certService.downloadCertificate(cert.course_id)
      setViewData(data)
      setIsModalOpen(true)
    } catch {
      // ممكن نضيف toast هون لو حابب
    } finally {
      setOpeningCourseId(null)
    }
  }

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: 24 }}>
        <h2 className="section-title">الشهادات والتحقق من الهوية</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '4px 0 0' }}>شهاداتك المكتسبة وحالة التحقق من هويتك</p>
      </div>

      {/* KYC Banner */}
      <div style={{ background: kyc.bg, border: `1px solid ${kyc.border}`, borderRadius: 16, padding: '18px 22px', marginBottom: 28, display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>        <span style={{ fontSize: 28, flexShrink: 0 }}>{kyc.icon}</span>
        <div style={{ flex: '1 1 220px' }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>التحقق من الهوية (KYC)</span>
            <span className="badge" style={{ background: kyc.bg, color: kyc.color, border: `1px solid ${kyc.border}` }}>{kyc.label}</span>
          </div>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.65)', margin: 0 }}>{kyc.desc}</p>
        </div>
        {kycStatus !== 'verified' && (
          <button className="btn-primary" style={{ padding: '9px 20px', fontSize: 13.5, flexShrink: 0 }} onClick={() => navigate('profile')}>
            الذهاب للتحقق
          </button>
        )}
      </div>

      {/* Certificates */}
      {loading ? (
        <SkeletonLoader type="card" count={3} />
      ) : error ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#f87171' }}>
          <div style={{ marginBottom: 10 }}>{error}</div>
          <button className="btn-outline" style={{ padding: '8px 20px' }} onClick={refetch}>إعادة المحاولة</button>
        </div>
      ) : activeCertificates.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.35)' }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>🏆</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>لا توجد شهادات بعد</div>
          <div style={{ fontSize: 13.5 }}>أكمل متطلبات كورس (محتوى + حضور + اختبارات) للحصول على شهادتك</div>
        </div>
      ) : (
        <div className="grid-2">
          {activeCertificates.map(c => (
            <div key={c.certificate_id} style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.4) 0%, rgba(6,182,212,0.2) 100%)',
                padding: '32px 28px', textAlign: 'center', position: 'relative',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ position: 'absolute', top: 10, right: 10 }}>
                  <span className="badge badge-success">نشطة</span>
                </div>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>شهادة إتمام</div>
                <div style={{ fontSize: 17, fontWeight: 800 }}>{c.course_title_snapshot}</div>
                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.65)', marginTop: 6 }}>باسم: {c.student_name_snapshot}</div>
              </div>

              <div style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>📅 تاريخ الإصدار</span>
                    <span style={{ fontWeight: 500 }}>{new Date(c.issued_at).toLocaleDateString('ar')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)' }}>🔖 رقم الشهادة</span>
                    <span style={{ fontWeight: 500, fontFamily: 'monospace', fontSize: 11 }}>{c.certificate_id.slice(0, 13)}…</span>
                  </div>
                </div>
                <button
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: 13.5 }}
                  disabled={openingCourseId === c.course_id}
                  onClick={() => handleOpenCertificate(c)}
                >
                  {openingCourseId === c.course_id ? '...جارٍ التحميل' : '📄 عرض الشهادة'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <CertificateViewModal isOpen={isModalOpen} data={viewData} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}