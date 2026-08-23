// src/pages/instructor/InstructorSetup.tsx
import { useState, useRef } from 'react'
import { useNav } from '../../context/NavContext'
import { useAuthApi } from '../../context/AuthApiContext'
import API from '../../config/api'

export default function InstructorSetup() {
    const { refreshUser } = useNav()
    const { setupMfa, confirmMfa, logout } = useAuthApi()

    // MFA state
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
    const [manualEntryKey, setManualEntryKey] = useState<string>('')
    const [mfaCode, setMfaCode] = useState<string>('')
    const [mfaLoading, setMfaLoading] = useState<boolean>(false)
    const [mfaVerified, setMfaVerified] = useState<boolean>(false)
    const [backupCodes, setBackupCodes] = useState<string[]>([])
    const [step, setStep] = useState<1 | 2>(1) // 1 = MFA, 2 = KYC

    // KYC state
    const [idDocumentType, setIdDocumentType] = useState<'national_id' | 'passport'>('national_id')
    const [idFile, setIdFile] = useState<File | null>(null)
    const [selfieFile, setSelfieFile] = useState<File | null>(null)
    const [kycLoading, setKycLoading] = useState<boolean>(false)
    const [kycDone, setKycDone] = useState<boolean>(false)

    const [error, setError] = useState<string>('')

    // ---------- MFA ----------
    const handleSetupMfa = async () => {
        setError('')
        setMfaLoading(true)
        try {
            const result = await setupMfa()
            setQrCodeDataUrl(result.qrCodeDataUrl)
            setManualEntryKey(result.manualEntryKey)
        } catch (err: any) {
            setError(err.message || 'فشل في إنشاء رمز MFA')
        } finally {
            setMfaLoading(false)
        }
    }

    const handleVerifyMfa = async () => {
        if (!mfaCode || mfaCode.length < 6) {
            setError('الرجاء إدخال رمز التحقق المكون من 6 أرقام')
            return
        }
        setError('')
        setMfaLoading(true)
        try {
            const result = await confirmMfa(mfaCode)
            setBackupCodes(result.backupCodes || [])
            setMfaVerified(true)
            // تحديث حالة المستخدم في السياق
            await refreshUser()
            // الانتقال للخطوة التالية
            setStep(2)
        } catch (err: any) {
            setError(err.message || 'رمز التحقق غير صحيح')
        } finally {
            setMfaLoading(false)
        }
    }

    // ---------- KYC  ----------
    const KYC_ERROR_MESSAGES: Record<string, string> = {
        MISSING_FILES: 'الرجاء تحميل صورة الهوية وصورة السيلفي معًا.',
        ACCOUNT_NOT_ACTIVE: 'حسابك غير نشط حاليًا، تواصل مع الدعم.',
        ROLE_NOT_ELIGIBLE: 'هذا الدور لا يسمح بتقديم طلب توثيق.',
        MFA_NOT_ENABLED: 'يجب تفعيل التحقق الثنائي أولًا قبل إرسال طلب التوثيق.',
        REQUEST_ALREADY_PENDING: 'لديك طلب توثيق قيد المراجعة بالفعل.',
        ALREADY_VERIFIED: 'حسابك موثّق بالفعل.',
        INVALID_FILE: 'صيغة أو حجم أحد الملفين غير مقبول. تأكد من أنها صورة واضحة.',
    }

    const handleKycSubmit = async () => {
        if (!idFile) {
            setError('الرجاء تحميل صورة الهوية')
            return
        }
        if (!selfieFile) {
            setError('الرجاء تحميل صورة السيلفي (صورة شخصية واضحة)')
            return
        }
        setError('')
        setKycLoading(true)

        try {
            const formData = new FormData()
            formData.append('idDocumentType', idDocumentType)
            formData.append('id_document', idFile)
            formData.append('selfie', selfieFile)

            await API.post('/kyc/requests', formData)

            setKycDone(true)
            await refreshUser()
            // ملاحظة: kyc_status بعد الإرسال بيصير 'review_pending' مش 'verified'
            // فورًا — الموافقة تصير من الأدمن لاحقًا (kycReview.service.js). يعني
            // instructorSetupIncomplete بـ App.tsx رح يضل true لحد ما الأدمن يوافق،
            // وهاد سلوك صحيح ومقصود، مش باگ.
        } catch (err: any) {
            const code = err?.response?.data?.error?.code
            setError(KYC_ERROR_MESSAGES[code] || err?.response?.data?.error?.message || 'فشل في رفع مستندات KYC')
        } finally {
            setKycLoading(false)
        }
    }

    // ---------- التصميم ----------
    return (
        <div className="page-wrapper">
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
                <h2 className="section-title">🚀 إعداد حساب المدرّس</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '4px 0 24px' }}>
                    لإكمال تفعيل حسابك كمدرّس، يرجى تفعيل المصادقة الثنائية وإرسال مستندات التحقق.
                </p>

                {/* مؤشر الخطوات */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16 }}>
                    <span className="badge" style={{
                        background: step === 1 ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.08)',
                        color: step === 1 ? '#c4b5fd' : 'var(--text-subtle)',
                    }}>
                        الخطوة 1: تفعيل المصادقة الثنائية
                    </span>
                    <span style={{ color: 'var(--text-subtle)' }}>→</span>
                    <span className="badge" style={{
                        background: step === 2 ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.08)',
                        color: step === 2 ? '#c4b5fd' : 'var(--text-subtle)',
                    }}>
                        الخطوة 2: التحقق من الهوية (KYC)
                    </span>
                </div>

                {error && (
                    <div className="badge badge-danger" style={{ display: 'block', padding: '12px 16px', marginBottom: 20, fontSize: 13.5, fontWeight: 400 }}>
                        {error}
                    </div>
                )}

                {/* الخطوة 1: MFA */}
                {step === 1 && (
                    <div className="glass" style={{ padding: 24 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>🔐 تفعيل المصادقة الثنائية (MFA)</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 13.5 }}>
                            استخدم تطبيق Google Authenticator أو أي تطبيق TOTP لمسح الرمز، ثم أدخل الرمز الظاهر لديك.
                        </p>

                        {!qrCodeDataUrl ? (
                            <button className="btn-primary" onClick={handleSetupMfa} disabled={mfaLoading}>
                                {mfaLoading ? 'جاري التحميل...' : 'إنشاء رمز MFA'}
                            </button>
                        ) : (
                            <div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                                    <img src={qrCodeDataUrl} alt="QR Code for MFA" style={{ width: 200, height: 200, borderRadius: 12, background: '#fff', padding: 8 }} />
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
                                            placeholder="أدخل رمز التحقق المكون من 6 أرقام"
                                            value={mfaCode}
                                            onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            disabled={mfaVerified}
                                        />
                                    </div>
                                    <button
                                        className="btn-primary"
                                        onClick={handleVerifyMfa}
                                        disabled={mfaLoading || mfaVerified || mfaCode.length < 6}
                                        style={{ opacity: mfaLoading || mfaVerified || mfaCode.length < 6 ? 0.5 : 1 }}
                                    >
                                        {mfaLoading ? 'جاري التحقق...' : mfaVerified ? '✅ مفعّل' : 'تحقق'}
                                    </button>
                                </div>

                                {mfaVerified && backupCodes.length > 0 && (
                                    <div style={{ marginTop: 20, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: 16 }}>
                                        <p style={{ color: '#34d399', fontSize: 13.5, fontWeight: 600, marginBottom: 8 }}>
                                            ✅ تم تفعيل المصادقة الثنائية بنجاح
                                        </p>
                                        <p style={{ color: 'var(--text-muted)', fontSize: 12.5 }}>
                                            رموز الاسترداد (احفظها في مكان آمن):
                                        </p>
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
                        )}
                    </div>
                )}

                {/* الخطوة 2: KYC */}
                {step === 2 && (
                    <div className="glass" style={{ padding: 24 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>🪪 التحقق من الهوية (KYC)</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 13.5 }}>
                            أرسل صورة وثيقتك الرسمية وصورة سيلفي لإكمال التحقق. سيراجعها فريق الإدارة يدويًا.
                        </p>

                        {!kycDone ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                <div>
                                    <label className="form-label">نوع الوثيقة</label>
                                    <select
                                        className="form-input"
                                        value={idDocumentType}
                                        onChange={(e) => setIdDocumentType(e.target.value as 'national_id' | 'passport')}
                                    >
                                        <option value="national_id">الهوية الوطنية</option>
                                        <option value="passport">جواز السفر</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="form-label">صورة الوثيقة</label>
                                    <FileDropZone file={idFile} onSelect={setIdFile} label="انقر لتحميل صورة الوثيقة" />
                                </div>

                                <div>
                                    <label className="form-label">صورة سيلفي (وجهك واضح)</label>
                                    <FileDropZone file={selfieFile} onSelect={setSelfieFile} label="انقر لتحميل صورة سيلفي" />
                                </div>

                                <button
                                    className="btn-primary"
                                    onClick={handleKycSubmit}
                                    disabled={kycLoading}
                                    style={{ justifyContent: 'center', marginTop: 4 }}
                                >
                                    {kycLoading ? 'جاري الرفع...' : 'إرسال الطلب'}
                                </button>
                            </div>
                        ) : (
                            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: 16 }}>
                                <p style={{ color: '#34d399', fontWeight: 600, marginBottom: 6, fontSize: 13.5 }}>✅ تم إرسال طلبك للمراجعة</p>
                                <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                                    سيراجع فريق الإدارة طلبك خلال 1-3 أيام عمل. رح تقدر تدخل للوحة التحكم بمجرد الموافقة.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* زر الخروج */}
                <div style={{ marginTop: 24, textAlign: 'center' }}>
                    <button className="btn-ghost" onClick={logout}>
                        تسجيل الخروج
                    </button>
                </div>
            </div>
        </div>
    )
}

function FileDropZone({ file, onSelect, label }: { file: File | null; onSelect: (f: File) => void; label: string }) {
    const ref = useRef<HTMLInputElement>(null)
    return (
        <div
            style={{
                border: '2px dashed var(--border)', borderRadius: 10, padding: 24,
                textAlign: 'center', cursor: 'pointer', background: 'rgba(255,255,255,0.02)',
            }}
            onClick={() => ref.current?.click()}
        >
            <input
                ref={ref}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={(e) => { if (e.target.files?.[0]) onSelect(e.target.files[0]) }}
            />
            {file ? <span style={{ color: '#4ade80' }}>✅ {file.name}</span> : <span style={{ color: 'var(--text-subtle)' }}>{label}</span>}
        </div>
    )
}