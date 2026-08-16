// src/pages/instructor/InstructorSetup.tsx
import { useState, useRef } from 'react'
import { useNav } from '../../context/NavContext'
import { useAuthApi } from '../../context/AuthApiContext'
import API from '../../config/api'

export default function InstructorSetup() {
    const { navigate, userName, refreshUser } = useNav()
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
    const fileInputRef = useRef<HTMLInputElement>(null)

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
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#fff', marginBottom: '0.5rem' }}>
                🚀 إعداد حساب المدرّس
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem' }}>
                لإكمال تفعيل حسابك كمدرّس، يرجى تفعيل المصادقة الثنائية وإرسال مستندات التحقق.
            </p>

            {/* مؤشر الخطوات */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                <span style={{ color: step === 1 ? '#a855f7' : 'rgba(255,255,255,0.3)', fontWeight: step === 1 ? 700 : 400 }}>
                    الخطوة 1: تفعيل المصادقة الثنائية
                </span>
                <span style={{ color: 'rgba(255,255,255,0.2)' }}>→</span>
                <span style={{ color: step === 2 ? '#a855f7' : 'rgba(255,255,255,0.3)', fontWeight: step === 2 ? 700 : 400 }}>
                    الخطوة 2: التحقق من الهوية (KYC)
                </span>
            </div>

            {error && (
                <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', borderRadius: 8, padding: '0.75rem 1rem', marginBottom: '1.5rem', color: '#f87171' }}>
                    {error}
                </div>
            )}

            {/* الخطوة 1: MFA */}
            {step === 1 && (
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', marginBottom: '0.75rem' }}>
                        🔐 تفعيل المصادقة الثنائية (MFA)
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                        استخدم تطبيق Google Authenticator أو أي تطبيق TOTP لمسح الرمز، ثم أدخل الرمز الظاهر لديك.
                    </p>

                    {!qrCodeDataUrl ? (
                        <button
                            onClick={handleSetupMfa}
                            disabled={mfaLoading}
                            style={{
                                padding: '0.75rem 2rem',
                                background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                border: 'none',
                                borderRadius: 10,
                                color: '#fff',
                                fontWeight: 600,
                                fontSize: '1rem',
                                cursor: mfaLoading ? 'not-allowed' : 'pointer',
                                opacity: mfaLoading ? 0.6 : 1,
                                transition: 'all 0.2s',
                            }}
                        >
                            {mfaLoading ? 'جاري التحميل...' : 'إنشاء رمز MFA'}
                        </button>
                    ) : (
                        <div>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                                <img src={qrCodeDataUrl} alt="QR Code for MFA" style={{ width: 200, height: 200, borderRadius: 12, background: '#fff', padding: 8 }} />
                                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '0.75rem 1rem', borderRadius: 8, width: '100%', textAlign: 'center' }}>
                                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>المفتاح اليدوي: </span>
                                    <code style={{ color: '#a855f7', fontSize: '0.9rem', wordBreak: 'break-all' }}>{manualEntryKey}</code>
                                </div>
                            </div>

                            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <input
                                    type="text"
                                    placeholder="أدخل رمز التحقق المكون من 6 أرقام"
                                    value={mfaCode}
                                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    style={{
                                        flex: 1,
                                        padding: '0.7rem 1rem',
                                        background: 'rgba(255,255,255,0.06)',
                                        border: '1px solid rgba(255,255,255,0.12)',
                                        borderRadius: 10,
                                        color: '#fff',
                                        fontSize: '1rem',
                                        outline: 'none',
                                        minWidth: 200,
                                    }}
                                    disabled={mfaVerified}
                                />
                                <button
                                    onClick={handleVerifyMfa}
                                    disabled={mfaLoading || mfaVerified || mfaCode.length < 6}
                                    style={{
                                        padding: '0.7rem 2rem',
                                        background: mfaVerified ? 'rgba(34,197,94,0.2)' : 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                        border: 'none',
                                        borderRadius: 10,
                                        color: '#fff',
                                        fontWeight: 600,
                                        cursor: mfaLoading || mfaVerified || mfaCode.length < 6 ? 'not-allowed' : 'pointer',
                                        opacity: mfaLoading || mfaVerified || mfaCode.length < 6 ? 0.5 : 1,
                                    }}
                                >
                                    {mfaLoading ? 'جاري التحقق...' : mfaVerified ? '✅ مفعّل' : 'تحقق'}
                                </button>
                            </div>

                            {mfaVerified && backupCodes.length > 0 && (
                                <div style={{ marginTop: '1.5rem', background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '1rem' }}>
                                    <p style={{ color: '#4ade80', fontSize: '0.9rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                                        ✅ تم تفعيل المصادقة الثنائية بنجاح
                                    </p>
                                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem' }}>
                                        رموز الاسترداد (احفظها في مكان آمن):
                                    </p>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
                                        {backupCodes.map((code, i) => (
                                            <code key={i} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.7rem', borderRadius: 6, color: '#fbbf24', fontSize: '0.8rem' }}>
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
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 16, padding: '1.5rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', marginBottom: '0.75rem' }}>
                        🪪 التحقق من الهوية (KYC)
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                        أرسل صورة وثيقتك الرسمية وصورة سيلفي لإكمال التحقق. سيراجعها فريق الإدارة يدويًا.
                    </p>

                    {!kycDone ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            <div>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '0.3rem' }}>نوع الوثيقة</label>
                                <select
                                    value={idDocumentType}
                                    onChange={(e) => setIdDocumentType(e.target.value as 'national_id' | 'passport')}
                                    style={{
                                        width: '100%', padding: '0.7rem 1rem',
                                        background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
                                        borderRadius: 10, color: '#fff', fontSize: '1rem', outline: 'none',
                                    }}
                                >
                                    <option value="national_id">الهوية الوطنية</option>
                                    <option value="passport">جواز السفر</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '0.3rem' }}>صورة الوثيقة</label>
                                <FileDropZone file={idFile} onSelect={setIdFile} label="انقر لتحميل صورة الوثيقة" />
                            </div>

                            <div>
                                <label style={{ display: 'block', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', marginBottom: '0.3rem' }}>صورة سيلفي (وجهك واضح)</label>
                                <FileDropZone file={selfieFile} onSelect={setSelfieFile} label="انقر لتحميل صورة سيلفي" />
                            </div>

                            <button
                                onClick={handleKycSubmit}
                                disabled={kycLoading}
                                style={{
                                    padding: '0.75rem',
                                    background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
                                    border: 'none', borderRadius: 10, color: '#fff', fontWeight: 600, fontSize: '1rem',
                                    cursor: kycLoading ? 'not-allowed' : 'pointer',
                                    opacity: kycLoading ? 0.6 : 1, transition: 'all 0.2s', marginTop: '0.5rem',
                                }}
                            >
                                {kycLoading ? 'جاري الرفع...' : 'إرسال الطلب'}
                            </button>
                        </div>
                    ) : (
                        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '1rem' }}>
                            <p style={{ color: '#4ade80', fontWeight: 600, marginBottom: 6 }}>✅ تم إرسال طلبك للمراجعة</p>
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
                                سيراجع فريق الإدارة طلبك خلال 1-3 أيام عمل. رح تقدر تدخل للوحة التحكم بمجرد الموافقة.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* زر الخروج */}
            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <button
                    onClick={logout}
                    style={{
                        background: 'transparent',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: 'rgba(255,255,255,0.5)',
                        padding: '0.5rem 1.5rem',
                        borderRadius: 8,
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                    }}
                >
                    تسجيل الخروج
                </button>
            </div>
        </div>
    )
}

function FileDropZone({ file, onSelect, label }: { file: File | null; onSelect: (f: File) => void; label: string }) {
    const ref = useRef<HTMLInputElement>(null)
    return (
        <div
            style={{
                border: '2px dashed rgba(255,255,255,0.2)', borderRadius: 10, padding: '1.5rem',
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
            {file ? <span style={{ color: '#4ade80' }}>✅ {file.name}</span> : <span style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</span>}
        </div>
    )
}