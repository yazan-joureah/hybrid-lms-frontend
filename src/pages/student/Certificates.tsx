import { useState } from 'react'

const certs = [
  { id: 1, title: 'JavaScript من الصفر للاحتراف', issuer: 'Edujar', date: '2026-06-15', course: 'JavaScript Fundamentals', grade: '92%', serial: 'EDU-2026-JS-0042' },
  { id: 2, title: 'HTML & CSS الأساسيات', issuer: 'Edujar', date: '2026-05-20', course: 'HTML & CSS', grade: '88%', serial: 'EDU-2026-WD-0031' },
]

export default function Certificates() {
  const [kycStatus] = useState<'verified' | 'pending' | 'rejected'>('verified')
  const [qrModal, setQrModal] = useState<typeof certs[0] | null>(null)

  const kycConfig = {
    verified: { label: 'موثّق ✓', color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)', icon: '🛡️', desc: 'هويتك موثّقة. يمكنك تحميل شهاداتك وعرضها رسمياً.' },
    pending: { label: 'قيد المراجعة', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', icon: '⏳', desc: 'جارٍ مراجعة هويتك. ستتلقى إشعاراً عند اكتمال التحقق.' },
    rejected: { label: 'مرفوض', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', icon: '❌', desc: 'تم رفض طلب التحقق. يرجى إعادة رفع المستندات.' },
  }

  const kyc = kycConfig[kycStatus]

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: 24 }}>
        <h2 className="section-title">الشهادات والتحقق من الهوية</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '4px 0 0' }}>شهاداتك المكتسبة وحالة التحقق من هويتك</p>
      </div>

      {/* KYC Banner */}
      <div style={{ background: kyc.bg, border: `1px solid ${kyc.border}`, borderRadius: 16, padding: '18px 22px', marginBottom: 28, display: 'flex', gap: 16, alignItems: 'center' }}>
        <span style={{ fontSize: 28, flexShrink: 0 }}>{kyc.icon}</span>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 700 }}>التحقق من الهوية (KYC)</span>
            <span className="badge" style={{ background: kyc.bg, color: kyc.color, border: `1px solid ${kyc.border}` }}>{kyc.label}</span>
          </div>
          <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.65)', margin: 0 }}>{kyc.desc}</p>
        </div>
        {kycStatus !== 'verified' && (
          <button className="btn-primary" style={{ padding: '9px 20px', fontSize: 13.5, flexShrink: 0 }}>
            {kycStatus === 'pending' ? 'عرض التفاصيل' : 'إعادة التحقق'}
          </button>
        )}
      </div>

      {/* Certificates */}
      {certs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.35)' }}>
          <div style={{ fontSize: 52, marginBottom: 14 }}>🏆</div>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>لا توجد شهادات بعد</div>
          <div style={{ fontSize: 13.5 }}>أكمل كورساً للحصول على شهادتك</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 22 }}>
          {certs.map(c => (
            <div key={c.id} style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
              {/* Certificate preview */}
              <div style={{
                background: 'linear-gradient(135deg, rgba(124,58,237,0.4) 0%, rgba(6,182,212,0.2) 100%)',
                padding: '32px 28px', textAlign: 'center', position: 'relative',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
              }}>
                <div style={{ position: 'absolute', top: 10, right: 10 }}>
                  <span className="badge badge-success">موثّق</span>
                </div>
                <div style={{ fontSize: 40, marginBottom: 12 }}>🏆</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>شهادة إتمام</div>
                <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 4 }}>{c.title}</div>
                <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>أحمد محمد</div>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                  <span className="badge badge-primary">{c.grade}</span>
                </div>
              </div>

              <div style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                  {[['📅 التاريخ', c.date], ['🔖 الرقم التسلسلي', c.serial], ['🏛️ المصدر', c.issuer]].map(([l, v]) => (
                    <div key={l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                      <span style={{ color: 'rgba(255,255,255,0.5)' }}>{l}</span>
                      <span style={{ fontWeight: 500 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '9px', fontSize: 13 }}>
                    ⬇ تحميل PDF
                  </button>
                  <button className="btn-outline" style={{ padding: '9px 16px', fontSize: 13 }} onClick={() => setQrModal(c)}>
                    📱 QR
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QR Modal */}
      {qrModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
          onClick={() => setQrModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'rgba(12,4,45,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 22, padding: '36px', maxWidth: 360, width: '100%', textAlign: 'center' }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 6px' }}>رمز QR للتحقق</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 24px' }}>{qrModal.title}</p>
            {/* Fake QR */}
            <div style={{ width: 180, height: 180, margin: '0 auto 20px', background: '#fff', borderRadius: 12, display: 'grid', gridTemplateColumns: 'repeat(9,1fr)', gap: 2, padding: 12 }}>
              {Array.from({ length: 81 }, (_, i) => (
                <div key={i} style={{ borderRadius: 1, background: Math.random() > 0.5 ? '#000' : 'transparent', aspectRatio: '1' }} />
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 16, fontFamily: 'monospace' }}>{qrModal.serial}</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', marginBottom: 20, padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: 10 }}>
              امسح هذا الرمز للتحقق من صحة الشهادة عبر موقع Edujar
            </div>
            <button className="btn-primary" style={{ padding: '10px 32px', justifyContent: 'center' }} onClick={() => setQrModal(null)}>إغلاق</button>
          </div>
        </div>
      )}
    </div>
  )
}
