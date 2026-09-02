// src/pages/admin/AdminSetup.tsx
import { useState, useEffect } from 'react'
import { useNav } from '../../context/NavContext'
import { useAuthApi } from '../../context/AuthApiContext'

export default function AdminSetup() {
    const { navigate, refreshUser, logout, mfaEnabled, adminSetupIncomplete, role } = useNav()
    const { setupMfa, confirmMfa, getErrorMessage } = useAuthApi()

    const [qrCodeDataUrl, setQrCodeDataUrl] = useState('')
    const [manualEntryKey, setManualEntryKey] = useState('')
    const [mfaCode, setMfaCode] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [backupCodes, setBackupCodes] = useState<string[]>([])

    // ✅ بمجرد اكتمال الإعداد (MFA مفعّل)، ينتقل تلقائيًا للوحة التحكم
    useEffect(() => {
        if (!adminSetupIncomplete) {
            navigate('admin-dashboard')
        }
    }, [adminSetupIncomplete, navigate])

    const handleSetupMfa = async () => {
        setError('')
        setLoading(true)
        try {
            const result = await setupMfa()
            setQrCodeDataUrl(result.qrCodeDataUrl)
            setManualEntryKey(result.manualEntryKey)
        } catch (err: any) {
            setError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyMfa = async () => {
        if (mfaCode.length !== 6) {
            setError('الرجاء إدخال رمز التحقق المكون من 6 أرقام')
            return
        }
        setError('')
        setLoading(true)
        try {
            const result = await confirmMfa(mfaCode)
            setBackupCodes(result.backupCodes || [])
            await refreshUser()
        } catch (err: any) {
            setError(getErrorMessage(err))
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="page-wrapper">
            <div style={{ maxWidth: 640, margin: '0 auto' }}>
                <h2 className="section-title">🔐 تفعيل التحقق الثنائي (إلزامي)</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '4px 0 24px' }}>
                    لأسباب أمنية، حساب {role === 'superadmin' ? 'المشرف العام' : 'المشرف'} لا يمكنه
                    الوصول للوحة تحكم الإدارة إلا بعد تفعيل التحقق الثنائي (2FA).
                </p>

                {error && (
                    <div className="badge badge-danger" style={{ display: 'block', padding: '12px 16px', marginBottom: 20, fontSize: 13.5, fontWeight: 400 }}>
                        {error}
                    </div>
                )}

                <div className="glass" style={{ padding: 24 }}>
                    {!qrCodeDataUrl ? (
                        <>
                            <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 13.5 }}>
                                استخدم تطبيق Google Authenticator أو أي تطبيق TOTP مشابه.
                            </p>
                            <button className="btn-primary" onClick={handleSetupMfa} disabled={loading}>
                                {loading ? 'جاري التحضير...' : 'إنشاء رمز QR'}
                            </button>
                        </>
                    ) : backupCodes.length === 0 ? (
                        <div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                                <img src={qrCodeDataUrl} alt="QR Code" style={{ width: 200, height: 200, borderRadius: 12, background: '#fff', padding: 8 }} />
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px 14px', borderRadius: 8, width: '100%', textAlign: 'center' }}>
                                    <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>المفتاح اليدوي: </span>
                                    <code style={{ color: 'var(--primary-light)', fontSize: 13.5, wordBreak: 'break-all' }}>{manualEntryKey}</code>
                                </div>
                            </div>
                            <div style={{ marginTop: 20, display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: 200 }}>
                                    <label className="form-label">رمز التحقق</label>
                                    <input
                                        className="form-input"
                                        type="text"
                                        placeholder="123456"
                                        value={mfaCode}
                                        onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    />
                                </div>
                                <button className="btn-primary" onClick={handleVerifyMfa} disabled={loading || mfaCode.length < 6}>
                                    {loading ? 'جارٍ التحقق...' : 'تحقق وفعّل'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: 16 }}>
                            <p style={{ color: '#34d399', fontSize: 13.5, fontWeight: 600, marginBottom: 8 }}>
                                ✅ تم التفعيل! جارٍ تحويلك للوحة التحكم...
                            </p>
                            <p style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>رموز الاسترداد (احفظها بمكان آمن):</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                                {backupCodes.map((code, i) => (
                                    <code key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 6, color: '#fbbf24', fontSize: 12.5 }}>
                                        {code}
                                    </code>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ marginTop: 24, textAlign: 'center' }}>
                    <button className="btn-ghost" onClick={logout}>تسجيل الخروج</button>
                </div>
            </div>
        </div>
    )
}