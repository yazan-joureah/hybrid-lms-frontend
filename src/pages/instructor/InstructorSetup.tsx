// src/pages/instructor/InstructorSetup.tsx
import { useState, useRef, useEffect } from 'react'
import { useNav } from '../../context/NavContext'
import { useAuthApi } from '../../context/AuthApiContext'
import { BackupCodesModal } from '../../components/common/BackupCodesModal'
import API from '../../config/api'

export default function InstructorSetup() {
    const { refreshUser, logout, navigate, mfaEnabled, kycStatus, instructorSetupIncomplete } = useNav()
    const { setupMfa, confirmMfa } = useAuthApi()

    // ✅ الخطوة الحالية مُشتقّة من الحالة الحقيقية القادمة من الباك اند،
    // مش من قيمة ثابتة — هذا يحل مشكلة "الرجوع لأول خطوة" بعد أي remount
    // (تسجيل دخول جديد، أو حتى إعادة تحميل الصفحة).
    const [step, setStep] = useState<1 | 2>(mfaEnabled ? 2 : 1)

    // MFA state
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
    const [manualEntryKey, setManualEntryKey] = useState<string>('')
    const [mfaCode, setMfaCode] = useState<string>('')
    const [mfaLoading, setMfaLoading] = useState<boolean>(false)
    const [mfaVerified, setMfaVerified] = useState<boolean>(mfaEnabled)
    const [backupCodes, setBackupCodes] = useState<string[]>([])

    // KYC state
    const [idDocumentType, setIdDocumentType] = useState<'national_id' | 'passport'>('national_id')
    const [idFile, setIdFile] = useState<File | null>(null)
    const [selfieFile, setSelfieFile] = useState<File | null>(null)
    const [kycLoading, setKycLoading] = useState<boolean>(false)
    const [checkingStatus, setCheckingStatus] = useState<boolean>(false)

    const [error, setError] = useState<string>('')

    // ✅ إذا صار الإعداد مكتمل فعليًا (مثلاً الأدمن وافق على KYC بينما
    // الصفحة كانت مفتوحة بتاب قديم)، ينتقل تلقائيًا للداشبورد بدل ما يضل
    // واقف هون بدون داعي.
    useEffect(() => {
        if (!instructorSetupIncomplete) {
            navigate('instructor-dashboard')
        }
    }, [instructorSetupIncomplete, navigate])

    // ✅ يبقي step متزامن لو mfaEnabled تغيّرت من مصدر خارجي (مثلاً refreshUser
    // منادى من مكان تاني بالتطبيق)
    useEffect(() => {
        if (mfaEnabled) {
            setMfaVerified(true)
            setStep((prev) => (prev === 1 ? 2 : prev))
        }
    }, [mfaEnabled])

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
            await refreshUser() // يحدّث mfaEnabled بـ NavContext من مصدر الحقيقة الوحيد (الباك اند)
            setStep(2)
        } catch (err: any) {
            setError(err.message || 'رمز التحقق غير صحيح')
        } finally {
            setMfaLoading(false)
        }
    }

    // ---------- KYC ----------
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

            // ✅ ما منخزّن "تم الإرسال" بـ state محلي منفصل — بنعتمد فورًا على
            // refreshUser() لجيب kyc_status الحقيقي ('review_pending') من
            // الباك اند، عشان يضل متزامن حتى لو الصفحة انعمل remount بعدين.
            await refreshUser()
        } catch (err: any) {
            const code = err?.response?.data?.error?.code
            setError(KYC_ERROR_MESSAGES[code] || err?.response?.data?.error?.message || 'فشل في رفع مستندات KYC')
        } finally {
            setKycLoading(false)
        }
    }

    // ✅ زر "تحقق من الحالة" — يسمح للمدرّس يتأكد يدويًا إذا الأدمن وافق،
    // بدون ما يحتاج يعمل logout/login من جديد.
    const handleCheckStatus = async () => {
        setCheckingStatus(true)
        try {
            await refreshUser()
        } finally {
            setCheckingStatus(false)
        }
    }

    const kycAwaitingReview = kycStatus === 'review_pending' || kycStatus === 'age_flagged'
    const kycRejected = kycStatus === 'rejected'

    // ---------- التصميم ----------
    return (
        <div className="page-wrapper">
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
                <h2 className="section-title">🚀 إعداد حساب المدرّس</h2>
                <p style={{ color: 'var(--text-muted)', fontSize: 14, margin: '4px 0 24px' }}>
                    لإكمال تفعيل حسابك كمدرّس، يرجى تفعيل المصادقة الثنائية وإرسال مستندات التحقق.
                </p>

                {/* مؤشر الخطوات */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 24, borderBottom: '1px solid var(--border)', paddingBottom: 16, flexWrap: 'wrap' }}>
                    <span className="badge" style={{
                        background: mfaEnabled ? 'rgba(16,185,129,0.15)' : (step === 1 ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.08)'),
                        color: mfaEnabled ? '#34d399' : (step === 1 ? '#c4b5fd' : 'var(--text-subtle)'),
                    }}>
                        {mfaEnabled ? '✅' : ''} الخطوة 1: تفعيل المصادقة الثنائية
                    </span>
                    <span style={{ color: 'var(--text-subtle)' }}>→</span>
                    <span className="badge" style={{
                        background: kycStatus === 'verified' ? 'rgba(16,185,129,0.15)' : (step === 2 ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.08)'),
                        color: kycStatus === 'verified' ? '#34d399' : (step === 2 ? '#c4b5fd' : 'var(--text-subtle)'),
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
                {step === 1 && !mfaEnabled && (
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

                                {mfaVerified && (
                                    <div style={{ marginTop: 20, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: 16 }}>
                                        <p style={{ color: '#34d399', fontSize: 13.5, fontWeight: 600, margin: 0 }}>
                                            ✅ تم تفعيل المصادقة الثنائية بنجاح
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {/* الخطوة 2: KYC — تظهر بمجرد ما mfaEnabled=true (بغض النظر عن step المحلية) */}
                {mfaEnabled && kycStatus !== 'verified' && (
                    <div className="glass" style={{ padding: 24 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>🪪 التحقق من الهوية (KYC)</h3>

                        {kycAwaitingReview ? (
                            // ✅ الحالة الناقصة سابقًا: طلب مُرسَل فعلًا وبانتظار الأدمن —
                            // ما بنعيد إظهار فورم الرفع، وبنوضح الحالة بدل ما "يضيع" المستخدم
                            <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, padding: 16 }}>
                                <p style={{ color: '#fbbf24', fontWeight: 600, marginBottom: 6, fontSize: 13.5 }}>
                                    ⏳ طلبك قيد المراجعة
                                </p>
                                <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 14 }}>
                                    سيراجع فريق الإدارة طلبك خلال 1-3 أيام عمل. رح تنتقل للوحة التحكم تلقائيًا بمجرد الموافقة.
                                </p>
                                <button className="btn-outline" onClick={handleCheckStatus} disabled={checkingStatus} style={{ fontSize: 13 }}>
                                    {checkingStatus ? 'جاري التحقق...' : '🔄 تحقق من حالة الطلب الآن'}
                                </button>
                            </div>
                        ) : (
                            <>
                                {kycRejected && (
                                    <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: 14, marginBottom: 18 }}>
                                        <p style={{ color: '#f87171', fontSize: 13.5, fontWeight: 600, margin: 0 }}>
                                            ❌ تم رفض طلبك السابق. يرجى مراجعة الصور وإعادة الإرسال.
                                        </p>
                                    </div>
                                )}
                                <p style={{ color: 'var(--text-muted)', marginBottom: 20, fontSize: 13.5 }}>
                                    أرسل صورة وثيقتك الرسمية وصورة سيلفي لإكمال التحقق. سيراجعها فريق الإدارة يدويًا.
                                </p>
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
                            </>
                        )}
                    </div>
                )}

                {/* زر الخروج */}
                <div style={{ marginTop: 24, textAlign: 'center' }}>
                    <button className="btn-ghost" onClick={logout}>
                        تسجيل الخروج
                    </button>
                </div>

                {/* BackupCodesModal — يظهر خارج أي شرط، في نهاية الصفحة */}
                {backupCodes.length > 0 && (
                    <BackupCodesModal codes={backupCodes} onDismiss={() => setBackupCodes([])} />
                )}
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