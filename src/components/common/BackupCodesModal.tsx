// src/components/common/BackupCodesModal.tsx
import { useState } from 'react'
import { ModalPortal } from './ModalPortal'

interface Props {
    codes: string[]
    onDismiss: () => void
}

// ⚠️ هاي الرموز تُعرض مرة واحدة فقط من الباك (mfa.service.js:confirmTotpSetup
// لا يخزّن النص الخام، فقط الـ hash). لا يوجد endpoint لإعادة توليدها أو
// لاستخدامها بتسجيل الدخول حاليًا — العرض/النسخ/التحميل هون هو آخر فرصة
// للمستخدم للاحتفاظ فيها.
export function BackupCodesModal({ codes, onDismiss }: Props) {
    const [copied, setCopied] = useState(false)
    const [confirmed, setConfirmed] = useState(false)

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(codes.join('\n'))
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch {
            // بيئات بدون Clipboard API — التحميل يبقى بديل متاح
        }
    }

    const handleDownload = () => {
        const content = [
            'Hybrid LMS — رموز الاسترجاع الاحتياطية (Backup Codes)',
            `تاريخ الإصدار: ${new Date().toLocaleString('ar')}`,
            '',
            ...codes,
            '',
            'احتفظ بهذا الملف في مكان آمن. كل رمز يُستخدم مرة واحدة فقط.',
        ].join('\n')
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'hybrid-lms-backup-codes.txt'
        document.body.appendChild(link)
        link.click()
        link.remove()
        URL.revokeObjectURL(url)
    }

    return (
        <ModalPortal>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 450, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
                <div style={{ background: 'rgba(12,4,45,0.98)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 22, padding: 30, maxWidth: 460, width: '100%', boxShadow: '0 24px 70px rgba(0,0,0,0.55)' }}>
                    <div style={{ textAlign: 'center', marginBottom: 20 }}>
                        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 14px' }}>🔑</div>
                        <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 6px' }}>احتفظ برموز الاسترجاع الآن</h3>
                        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', margin: 0, lineHeight: 1.7 }}>
                            هذه الرموز لن تظهر مرة أخرى. كل رمز يُستخدم مرة واحدة فقط لاسترجاع حسابك إذا فقدت تطبيق المصادقة.
                        </p>
                    </div>

                    <div style={{
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14,
                        padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18,
                    }}>
                        {codes.map((code, i) => (
                            <code key={i} style={{
                                fontFamily: 'monospace', fontSize: 13.5, color: '#fbbf24', textAlign: 'center',
                                background: 'rgba(245,158,11,0.08)', borderRadius: 8, padding: '7px 4px', letterSpacing: 0.5,
                            }}>
                                {code}
                            </code>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginBottom: 18 }}>
                        <button className="btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '10px', fontSize: 13 }} onClick={handleCopy}>
                            {copied ? '✓ تم النسخ' : '📋 نسخ الكل'}
                        </button>
                        <button className="btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '10px', fontSize: 13 }} onClick={handleDownload}>
                            ⬇ تحميل كملف
                        </button>
                    </div>

                    <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 12.5, color: 'rgba(255,255,255,0.65)', marginBottom: 18, cursor: 'pointer' }}>
                        <input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} style={{ marginTop: 2 }} />
                        لقد نسخت أو حمّلت رموزي، وأدرك أنها لن تُعرض مجدداً.
                    </label>

                    <button
                        className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14 }}
                        disabled={!confirmed} onClick={onDismiss}
                    >
                        تم، إغلاق
                    </button>
                </div>
            </div>
        </ModalPortal>
    )
}