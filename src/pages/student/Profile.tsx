import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { useNav } from '../../context/NavContext'
import { useAuthApi } from '../../context/AuthApiContext'
import { StudentPaymentsPanel } from '../payments/student/StudentPaymentsPanel'
import { ModalPortal } from '../../components/common/ModalPortal'
import OtpInput from '../../components/common/OtpInput'
import { userService } from '../../services/userService'
import { kycService } from '../../services/kycService'
import { BackupCodesModal } from '../../components/common/BackupCodesModal'

type BackendRole = 'Student' | 'Instructor' | 'Admin' | 'Superadmin'

const KYC_ERROR_MESSAGES: Record<string, string> = {
  MISSING_FILES: 'الرجاء تحميل صورة الهوية وصورة السيلفي معًا.',
  ACCOUNT_NOT_ACTIVE: 'حسابك غير نشط حاليًا، تواصل مع الدعم.',
  ROLE_NOT_ELIGIBLE: 'هذا الدور لا يسمح بتقديم طلب توثيق.',
  MFA_NOT_ENABLED: 'يجب تفعيل التحقق الثنائي أولًا قبل إرسال طلب التوثيق.',
  REQUEST_ALREADY_PENDING: 'لديك طلب توثيق قيد المراجعة بالفعل.',
  ALREADY_VERIFIED: 'حسابك موثّق بالفعل.',
  INVALID_FILE: 'صيغة أو حجم أحد الملفين غير مقبول.',
}

const AGE_CORRECTION_ERROR_MESSAGES: Record<string, string> = {
  NOT_AGE_FLAGGED: 'هذا الإجراء غير متاح لحالتك الحالية.',
  CORRECTION_ALREADY_PENDING: 'لديك طلب تصحيح عمر قيد المراجعة من ولي الأمر بالفعل.',
  GUARDIAN_EMAIL_SAME_AS_STUDENT: 'يجب أن يكون بريد ولي الأمر مختلفاً عن بريدك.',
  ACCOUNT_NOT_ACTIVE: 'حسابك غير نشط حالياً.',
}

const REJECTION_REASON_LABELS: Record<string, string> = {
  UNCLEAR_IMAGE: 'الصورة غير واضحة بما يكفي للمراجعة.',
  DOCUMENT_EXPIRED: 'الوثيقة المرفوعة منتهية الصلاحية.',
  DATA_MISMATCH: 'البيانات في الوثيقة لا تطابق بيانات حسابك (تم تصحيح تاريخ ميلادك تلقائياً — تحقق منه بتبويب "الملف الشخصي" قبل إعادة الرفع).',
  DOCUMENT_NOT_ACCEPTED: 'نوع الوثيقة المرفوعة غير مقبول.',
}

export default function Profile() {
  const { userName, setUserName, userEmail, setUserEmail, userPhone, setUserPhone, userDob, setUserDob, userBio, setUserBio, userGender, setUserGender, logout, navigate } = useNav()
  const {
    getCurrentUser, setupMfa, confirmMfa, getErrorMessage, uploadProfilePicture, getProfilePictureUrl, submitKyc,
    updateProfile, forgotPassword, resetPassword, requestAccountDeletion,
  } = useAuthApi()

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'verification' | 'billing'>(
    () => (sessionStorage.getItem('profile_initial_tab') as any) || 'profile'
  )

  useEffect(() => {
    if (sessionStorage.getItem('profile_initial_tab')) sessionStorage.removeItem('profile_initial_tab')
  }, [])

  const [name, setName] = useState(userName || 'أحمد محمد الأحمد')
  const [email, setEmail] = useState(userEmail || '')
  const [phone, setPhone] = useState(userPhone || '')
  const [dob, setDob] = useState(userDob || '')
  const [bio, setBio] = useState(userBio || '')
  const [gender, setGender] = useState<'male' | 'female'>(userGender || 'male')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [backendRole, setBackendRole] = useState<BackendRole | null>(null)
  const [kycStatus, setKycStatus] = useState<string | null>(null)
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  // رفع الصورة
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarBust, setAvatarBust] = useState(0)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState('')

  const [mfaActionLoading, setMfaActionLoading] = useState(false)
  const [mfaError, setMfaError] = useState('')
  const [totpSetup, setTotpSetup] = useState({ active: false, qrCode: '', secret: '' })
  const [totpCode, setTotpCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null)

  // KYC
  const [idDocumentType, setIdDocumentType] = useState<'national_id' | 'passport'>('national_id')
  const [idFile, setIdFile] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [kycLoading, setKycLoading] = useState(false)
  const [kycError, setKycError] = useState('')
  const [latestRejectionReason, setLatestRejectionReason] = useState<string | null>(null)

  // تصحيح العمر بعد age_flagged
  const [correctionBirthDate, setCorrectionBirthDate] = useState('')
  const [correctionGuardianEmail, setCorrectionGuardianEmail] = useState('')
  const [correctionLoading, setCorrectionLoading] = useState(false)
  const [correctionError, setCorrectionError] = useState('')
  const [correctionSent, setCorrectionSent] = useState(false)

  // ---------- حفظ الملف الشخصي (حقيقي الآن — PATCH /users/me) ----------
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileSaveError, setProfileSaveError] = useState('')

  // ---------- تغيير كلمة المرور (عبر OTP بما إنه لا يوجد endpoint مباشر) ----------
  type PwStep = 'idle' | 'otp' | 'newpass'
  const [pwStep, setPwStep] = useState<PwStep>('idle')
  const [pwCode, setPwCode] = useState('')
  const [pwOtpKey, setPwOtpKey] = useState(0)
  const [pwNewPass, setPwNewPass] = useState('')
  const [pwConfirmPass, setPwConfirmPass] = useState('')
  const [pwError, setPwError] = useState('')
  const [pwLoading, setPwLoading] = useState(false)
  const [pwCooldown, setPwCooldown] = useState(0)
  const [pwSuccess, setPwSuccess] = useState(false)

  // ---------- حذف/إغلاق الحساب (DELETE /auth/account) ----------
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [deleteReason, setDeleteReason] = useState('')
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [deleteResult, setDeleteResult] = useState<{ immediate: boolean; status: string } | null>(null)

  useEffect(() => {
    setName(userName || 'أحمد محمد الأحمد')
    setEmail(userEmail || '')
    setPhone(userPhone || '')
    setDob(userDob || '')
    setBio(userBio || '')
    setGender(userGender || 'male')
  }, [userName, userEmail, userPhone, userDob, userBio, userGender])

  const loadUser = () => {
    return userService.getMe().then((u) => {
      setUserId(u.id || null)
      setBackendRole((u.role as BackendRole) || 'Student')
      setKycStatus(u.kyc_status || 'not_submitted')
      setMfaEnabled(!!u.mfa_enabled)
      if (u.birth_date) setUserDob(String(u.birth_date).slice(0, 10))
    })
  }

  const loadLatestKycReason = () => {
    kycService.getMyLatestRequest()
      .then((latest) => setLatestRejectionReason(latest?.reviewDecisionReason || null))
      .catch(() => setLatestRejectionReason(null)) // فشل صامت — التفصيل غير حرج لعرض الصفحة
  }

  useEffect(() => {
    let cancelled = false
    setProfileLoading(true)
    loadUser()
      .then(() => { if (!cancelled) loadLatestKycReason() })
      .catch(() => {
        if (cancelled) return
        setBackendRole('Student')
        setKycStatus('not_submitted')
        setMfaEnabled(false)
      })
      .finally(() => { if (!cancelled) setProfileLoading(false) })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const isStudent = backendRole === 'Student'
  const isInstructor = backendRole === 'Instructor'
  const mfaMandatory = isInstructor

  // ---------- حفظ الملف الشخصي (PATCH /users/me) ----------
  const handleSave = async () => {
    setProfileSaveError('')
    setSavingProfile(true)
    try {
      const updated = await updateProfile({
        full_name: name.trim(),
        phone: phone.trim() || undefined,
        bio: bio.trim() || undefined,
        // تاريخ الميلاد مقفول سيرفريًا بعد التحقق (KYC) — لا نرسله أصلاً بهالحالة
        birth_date: kycStatus !== 'verified' && dob ? dob : undefined,
      })
      setUserName(updated.full_name || name)
      setUserEmail(updated.email || email)
      if (updated.phone !== undefined) setUserPhone(updated.phone || '')
      if (updated.bio !== undefined) setUserBio(updated.bio || '')
      if (updated.birth_date) setUserDob(String(updated.birth_date).slice(0, 10))
      setUserGender(gender) // ⚠️ الجندر UI محلي فقط — لا يوجد حقل جندر بموديل User بالباك
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setProfileSaveError(getErrorMessage(err))
    } finally {
      setSavingProfile(false)
    }
  }

  // ---------- رفع صورة حقيقي ----------
  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setAvatarError('')

    const localUrl = URL.createObjectURL(file)
    setAvatarPreview(localUrl)

    setUploadingAvatar(true)
    try {
      await userService.uploadProfilePicture(file)
      setAvatarBust((n) => n + 1)
    } catch (err) {
      setAvatarError(getErrorMessage(err))
      setAvatarPreview(null)
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const openFilePicker = () => fileInputRef.current?.click()

  const avatarSrc = avatarPreview
    ? avatarPreview
    : userId
      ? `${userService.getProfilePictureUrl(userId)}?v=${avatarBust}`
      : null

  // ---------- MFA ----------
  const handleStartTotpSetup = async () => {
    setMfaError('')
    setMfaActionLoading(true)
    try {
      const data = await setupMfa()
      setTotpSetup({ active: true, qrCode: data.qrCodeDataUrl, secret: data.manualEntryKey })
    } catch (err) {
      setMfaError(getErrorMessage(err))
    } finally {
      setMfaActionLoading(false)
    }
  }

  const handleCancelTotpSetup = () => {
    setTotpSetup({ active: false, qrCode: '', secret: '' })
    setTotpCode('')
    setMfaError('')
  }

  const handleVerifyTotpSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    if (totpCode.length !== 6) {
      setMfaError('أدخل الرمز المكوّن من 6 أرقام كاملاً')
      return
    }
    setMfaError('')
    setMfaActionLoading(true)
    try {
      const result = await confirmMfa(totpCode)
      setMfaEnabled(true)
      setTotpSetup({ active: false, qrCode: '', secret: '' })
      setTotpCode('')
      setBackupCodes(result.backupCodes && result.backupCodes.length > 0 ? result.backupCodes : null)
    } catch (err) {
      setMfaError(getErrorMessage(err))
    } finally {
      setMfaActionLoading(false)
    }
  }

  // ---------- KYC submit ----------
  const handleKycSubmit = async () => {
    if (!idFile) {
      setKycError('الرجاء تحميل صورة الوثيقة')
      return
    }
    if (!selfieFile) {
      setKycError('الرجاء تحميل صورة سيلفي')
      return
    }
    setKycError('')
    setKycLoading(true)
    try {
      await kycService.submitMyRequest({ idDocumentType, idDocumentFile: idFile, selfieFile })
      await loadUser()
      setLatestRejectionReason(null) // طلب جديد قيد المراجعة — لا داعي لعرض سبب الرفض القديم
      setIdFile(null)
      setSelfieFile(null)
    } catch (err: any) {
      const code = err?.response?.data?.error?.code
      setKycError(KYC_ERROR_MESSAGES[code] || getErrorMessage(err))
    } finally {
      setKycLoading(false)
    }
  }

  // ---------- تصحيح العمر بعد age_flagged ----------
  const handleAgeCorrectionSubmit = async () => {
    if (!correctionBirthDate) { setCorrectionError('أدخل تاريخ الميلاد الصحيح.'); return }
    if (!correctionGuardianEmail.trim()) { setCorrectionError('أدخل بريد ولي الأمر.'); return }
    setCorrectionError('')
    setCorrectionLoading(true)
    try {
      await kycService.requestAgeCorrection(correctionBirthDate, correctionGuardianEmail.trim())
      setCorrectionSent(true)
    } catch (err: any) {
      const code = err?.response?.data?.error?.code
      setCorrectionError(AGE_CORRECTION_ERROR_MESSAGES[code] || getErrorMessage(err))
    } finally {
      setCorrectionLoading(false)
    }
  }

  // ---------- تغيير كلمة المرور ----------
  const startPwCooldown = () => {
    setPwCooldown(60)
    const iv = setInterval(() => {
      setPwCooldown(prev => {
        if (prev <= 1) { clearInterval(iv); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const resetPasswordChangeFlow = () => {
    setPwStep('idle'); setPwCode(''); setPwOtpKey(k => k + 1)
    setPwNewPass(''); setPwConfirmPass(''); setPwError(''); setPwCooldown(0)
  }

  const handleStartPasswordChange = async () => {
    setPwError('')
    setPwLoading(true)
    try {
      await forgotPassword(email.trim().toLowerCase())
      setPwStep('otp')
      setPwCode('')
      setPwOtpKey(k => k + 1)
      startPwCooldown()
    } catch (err) {
      setPwError(getErrorMessage(err))
    } finally {
      setPwLoading(false)
    }
  }

  const handleConfirmPwOtp = () => {
    if (pwCode.length !== 6) { setPwError('أدخل الرمز المكوّن من 6 أرقام كاملاً'); return }
    setPwError('')
    setPwStep('newpass')
  }

  const handleFinishPasswordChange = async () => {
    if (pwNewPass.length < 15) { setPwError('كلمة المرور يجب أن تكون 15 حرفاً على الأقل (وفق معايير NIST SP 800-63-4)'); return }
    if (pwNewPass !== pwConfirmPass) { setPwError('كلمتا المرور غير متطابقتين'); return }
    setPwError('')
    setPwLoading(true)
    try {
      await resetPassword(email.trim().toLowerCase(), pwCode, pwNewPass)
      setPwSuccess(true)
      setPwStep('idle')
      // ⚠️ الباك يسحب كل الجلسات عند نجاح reset-password (session.service.js)
      // فلازم تسجيل خروج محلي فوري حتى ما يبقى المستخدم بحالة جلسة ميتة.
      setTimeout(() => { void logout() }, 2500)
    } catch (err: any) {
      const code = err?.response?.data?.error?.code
      if (code === 'INVALID_CODE' || code === 'CODE_EXPIRED' || code === 'TOO_MANY_ATTEMPTS') {
        setPwStep('otp'); setPwCode(''); setPwOtpKey(k => k + 1)
      }
      setPwError(getErrorMessage(err))
    } finally {
      setPwLoading(false)
    }
  }

  // ---------- حذف/إغلاق الحساب ----------
  const handleConfirmDeleteAccount = async () => {
    setDeleteError('')
    setDeleteLoading(true)
    try {
      const result = await requestAccountDeletion(deleteReason)
      setDeleteResult(result)
      if (result.immediate) {
        setTimeout(() => { void logout(); navigate('landing') }, 2200)
      }
    } catch (err) {
      setDeleteError(getErrorMessage(err))
    } finally {
      setDeleteLoading(false)
    }
  }

  const statCards: [string, string][] = isStudent
    ? [['📚', '3 كورسات نشطة'], ['🏆', '2 شهادة'], ['⏱️', '45 ساعة تعلم'], ['📊', '87% حضور']]
    : isInstructor
      ? [['📚', '3 كورسات تُدرَّس'], ['👥', '245 طالب مسجّل'], ['⭐', '4.8 تقييم متوسط'], ['🎥', '12 جلسة مباشرة']]
      : [['👥', 'إدارة المستخدمين'], ['📊', 'تحليلات المنصة'], ['✅', 'مراجعة الطلبات']]

  const kycBadge = () => {
    if (kycStatus === 'verified') return <span className="badge badge-success" style={{ fontSize: 11.5 }}>✓ KYC موثّق</span>
    if (kycStatus === 'review_pending') return <span className="badge" style={{ fontSize: 11.5 }}>⏳ KYC قيد المراجعة</span>
    if (kycStatus === 'rejected') return <span className="badge" style={{ fontSize: 11.5, background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>✗ KYC مرفوض</span>
    if (kycStatus === 'age_flagged') return <span className="badge" style={{ fontSize: 11.5, background: 'rgba(239,68,68,0.15)', color: '#f87171' }}>⚠ الحساب معلّق (تعارض بالعمر)</span>
    return <span className="badge" style={{ fontSize: 11.5, background: 'rgba(245,158,11,0.15)', color: '#fbbf24' }}>⚠ KYC غير مكتمل</span>
  }

  if (profileLoading) {
    return <div className="page-wrapper" style={{ padding: 40, textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>...جارٍ التحميل</div>
  }

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: 24 }}>
        <h2 className="section-title">الملف الشخصي والإعدادات</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '4px 0 0' }}>إدارة بياناتك وإعدادات الأمان</p>
      </div>

      <div className="profile-grid">
        {/* Left panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '24px', textAlign: 'center' }}>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', background: avatarSrc ? 'transparent' : 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800, color: '#fff', margin: '0 auto 12px', border: '3px solid rgba(168,85,247,0.5)' }}>
              {avatarSrc ? (
                <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }} />
              ) : (name || 'م')[0]}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{name || 'مستخدم'}</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.75)', marginBottom: 8 }}>
              {isStudent ? (gender === 'female' ? 'طالبة' : 'طالب')
                : isInstructor ? 'مدرّس'
                  : backendRole === 'Admin' ? 'مشرف'
                    : 'مشرف عام'}
            </div>
            {(isStudent || isInstructor) && kycBadge()}
            <button onClick={openFilePicker} disabled={uploadingAvatar} style={{ display: 'block', margin: '14px auto 0', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9999, padding: '7px 16px', color: 'rgba(255,255,255,0.7)', fontSize: 12.5, cursor: uploadingAvatar ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
              {uploadingAvatar ? '...جارٍ الرفع' : 'تغيير الصورة'}
            </button>
            {avatarError && <div style={{ color: '#f87171', fontSize: 11.5, marginTop: 8 }}>⚠️ {avatarError}</div>}
          </div>

          <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '18px' }}>
            {statCards.map(([i, l]) => (
              <div key={l} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13.5 }}>
                <span>{i}</span><span style={{ color: 'rgba(255,255,255,0.7)' }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main content */}
        <div>
          <div className="tab-bar" style={{ marginBottom: 22, display: 'inline-flex' }}>
            <div className={`tab-item${activeTab === 'profile' ? ' active' : ''}`} onClick={() => setActiveTab('profile')}>الملف الشخصي</div>
            <div className={`tab-item${activeTab === 'security' ? ' active' : ''}`} onClick={() => setActiveTab('security')}>الأمان</div>
            {(isStudent || isInstructor) && (
              <div className={`tab-item${activeTab === 'verification' ? ' active' : ''}`} onClick={() => setActiveTab('verification')}>التحقق (KYC)</div>
            )}
            {isStudent && (
              <div className={`tab-item${activeTab === 'billing' ? ' active' : ''}`} onClick={() => setActiveTab('billing')}>سجل الدفع</div>
            )}
          </div>

          {activeTab === 'profile' && (
            <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '28px' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 22px' }}>المعلومات الشخصية</h3>
              <div className="profile-fields-grid">
                <div>
                  <label className="form-label">الاسم الكامل</label>
                  <input className="form-input" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">البريد الإلكتروني</label>
                  <input className="form-input" type="email" value={email} disabled />
                </div>
                <div>
                  <label className="form-label">رقم الهاتف</label>
                  <input className="form-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">تاريخ الميلاد</label>
                  <input
                    className="form-input" type="date" value={dob}
                    onChange={e => setDob(e.target.value)}
                    disabled={kycStatus === 'verified'}
                    title={kycStatus === 'verified' ? 'مقفول بعد التحقق من الهوية (KYC)' : undefined}
                  />
                  {kycStatus === 'verified' && (
                    <div style={{ fontSize: 11, color: '#fbbf24', marginTop: 4 }}>🔒 مقفول بعد التحقق من الهوية</div>
                  )}
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">نبذة شخصية</label>
                <textarea className="form-input" rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="أنا طالب أحب تعلم تطوير الويب" style={{ resize: 'none' }} />
              </div>
              {profileSaveError && (
                <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>⚠️ {profileSaveError}</div>
              )}
              <button className="btn-primary" style={{ padding: '11px 28px', fontSize: 14 }} onClick={handleSave} disabled={savingProfile}>
                {savingProfile ? '...جارٍ الحفظ' : saved ? '✓ تم الحفظ' : 'حفظ التغييرات'}
              </button>
              <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.35)', marginTop: 10 }}>
                ℹ️ الجنس عرض محلي فقط للواجهة (لا يوجد حقل مقابل بالحساب)، وباقي الحقول تُحفظ على السيرفر فعليًا.
              </p>
            </div>
          )}

          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '24px' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px' }}>🔑 تغيير كلمة المرور</h3>

                {pwStep === 'idle' && !pwSuccess && (
                  <>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13.5, margin: '0 0 16px' }}>
                      سنرسل رمز تحقق من 6 أرقام إلى بريدك <strong style={{ color: '#c4b5fd' }}>{email}</strong> لتأكيد هويتك قبل تعيين كلمة مرور جديدة.
                    </p>
                    {pwError && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 14 }}>⚠️ {pwError}</div>}
                    <button className="btn-primary" style={{ padding: '11px 24px', fontSize: 14 }} disabled={pwLoading} onClick={handleStartPasswordChange}>
                      {pwLoading ? '...جارٍ الإرسال' : 'إرسال رمز التحقق'}
                    </button>
                  </>
                )}

                {pwStep === 'otp' && (
                  <div style={{ maxWidth: 380 }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 14 }}>أدخل الرمز المرسل إلى بريدك</p>
                    <div style={{ marginBottom: 10 }}>
                      <OtpInput key={pwOtpKey} onComplete={setPwCode} error={!!pwError} disabled={pwLoading} />
                    </div>
                    {pwError && <div style={{ textAlign: 'center', color: '#f87171', fontSize: 13, margin: '4px 0 10px' }}>{pwError}</div>}
                    <div style={{ textAlign: 'center', margin: '10px 0 18px', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                      {pwCooldown > 0
                        ? <>يمكن إعادة الإرسال خلال <span style={{ color: '#a855f7', fontWeight: 600 }}>{pwCooldown}s</span></>
                        : <button className="btn-ghost" style={{ fontSize: 13, color: '#a855f7', padding: '4px 8px' }} onClick={handleStartPasswordChange} disabled={pwLoading}>إعادة إرسال الرمز</button>}
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="btn-primary" onClick={handleConfirmPwOtp} disabled={pwCode.length !== 6}>تحقق ومتابعة</button>
                      <button className="btn-outline" onClick={resetPasswordChangeFlow}>إلغاء</button>
                    </div>
                  </div>
                )}

                {pwStep === 'newpass' && (
                  <div style={{ maxWidth: 380 }}>
                    <div style={{ marginBottom: 14 }}>
                      <label className="form-label">كلمة المرور الجديدة</label>
                      <input className="form-input" type="password" placeholder="••••••••" value={pwNewPass} onChange={e => setPwNewPass(e.target.value)} disabled={pwLoading} />
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <label className="form-label">تأكيد كلمة المرور</label>
                      <input className="form-input" type="password" placeholder="••••••••" value={pwConfirmPass} onChange={e => setPwConfirmPass(e.target.value)} disabled={pwLoading} />
                    </div>
                    {pwError && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 14 }}>⚠️ {pwError}</div>}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="btn-primary" disabled={pwLoading} onClick={handleFinishPasswordChange}>
                        {pwLoading ? '...جارٍ الحفظ' : 'حفظ كلمة المرور الجديدة'}
                      </button>
                      <button className="btn-outline" onClick={resetPasswordChangeFlow} disabled={pwLoading}>إلغاء</button>
                    </div>
                  </div>
                )}

                {pwSuccess && (
                  <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: 16 }}>
                    <p style={{ color: '#34d399', fontWeight: 600, marginBottom: 6, fontSize: 13.5 }}>✅ تم تغيير كلمة المرور بنجاح</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>لأسباب أمنية تم تسجيل الخروج من كل الأجهزة — سيتم تحويلك الآن...</p>
                  </div>
                )}
              </div>

              <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                  <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>🔐 التحقق الثنائي (2FA)</h3>
                  {mfaEnabled !== null && (
                    <span className={`badge ${mfaEnabled ? 'badge-success' : ''}`}>{mfaEnabled ? 'مفعّل' : 'غير مفعّل'}</span>
                  )}
                </div>

                {mfaMandatory && mfaEnabled === false && (
                  <div style={{ margin: '10px 0 14px', padding: '12px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10 }}>
                    <div style={{ fontSize: 13, color: '#f87171', fontWeight: 600 }}>⚠️ التحقق الثنائي إلزامي لحساب المدرّس</div>
                  </div>
                )}

                {mfaEnabled && (
                  <div style={{ marginTop: 12, padding: '14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12 }}>
                    <div style={{ fontSize: 13.5, color: '#34d399', fontWeight: 600 }}>✓ التحقق الثنائي مفعّل على حسابك</div>
                  </div>
                )}

                {mfaEnabled === false && !totpSetup.active && !backupCodes && (
                  <div>
                    <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', margin: '8px 0 12px' }}>أضف طبقة حماية إضافية لحسابك.</p>
                    {mfaError && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>⚠️ {mfaError}</div>}
                    <button className="btn-primary" onClick={handleStartTotpSetup} disabled={mfaActionLoading}>
                      {mfaActionLoading ? '...جارٍ التحضير' : 'تفعيل 2FA'}
                    </button>
                  </div>
                )}

                {totpSetup.active && (
                  <div style={{ marginTop: 14 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>الخطوة 1: امسح رمز QR</h4>
                    {totpSetup.qrCode && <img src={totpSetup.qrCode} alt="TOTP QR Code" style={{ width: 160, height: 160, borderRadius: 8, background: '#fff', padding: 8 }} />}
                    <p style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', margin: '10px 0' }}>
                      أو أدخل المفتاح يدويًا: <code style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: 4 }}>{totpSetup.secret}</code>
                    </p>
                    <form onSubmit={handleVerifyTotpSetup} className="form-stack" style={{ maxWidth: 300 }}>
                      <div className="field-group">
                        <label className="form-label">أدخل الرمز المكوّن من 6 أرقام</label>
                        <input className="form-input" type="text" maxLength={6} placeholder="123456" value={totpCode} onChange={e => setTotpCode(e.target.value.replace(/[^0-9]/g, ''))} disabled={mfaActionLoading} />
                      </div>
                      {mfaError && <div style={{ color: '#f87171', fontSize: 13 }}>⚠️ {mfaError}</div>}
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button type="submit" className="btn-primary" disabled={mfaActionLoading}>{mfaActionLoading ? '...جارٍ التحقق' : 'تحقق وفعّل'}</button>
                        <button type="button" className="btn-secondary" onClick={handleCancelTotpSetup} disabled={mfaActionLoading}>إلغاء</button>
                      </div>
                    </form>
                  </div>
                )}

                {backupCodes && (
                  <BackupCodesModal codes={backupCodes} onDismiss={() => setBackupCodes(null)} />
                )}
              </div>

              {/* ---------- منطقة الخطر: حذف/إغلاق الحساب ---------- */}
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 18, padding: '24px' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px', color: '#f87171' }}>⚠️ منطقة الخطر</h3>
                <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, marginBottom: 16, lineHeight: 1.7 }}>
                  {isStudent && 'حذف حسابك كطالب يتم فوراً. تأكد من عدم وجود تسجيلات نشطة قبل المتابعة — يمكنك استرجاع الحساب خلال 30 يوماً فقط.'}
                  {isInstructor && 'حذف حساب المدرّس يتطلب مراجعة وموافقة الإدارة، ولن يُقبل الطلب إذا كان لديك كورسات غير مؤرشفة.'}
                  {!isStudent && !isInstructor && 'لا يمكن حذف حسابات الإدارة من هذه الصفحة.'}
                </p>
                {(isStudent || isInstructor) && (
                  <button
                    onClick={() => { setDeleteModalOpen(true); setDeleteError(''); setDeleteResult(null); setDeleteReason(''); setDeleteConfirmText('') }}
                    style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 9999, padding: '10px 22px', color: '#f87171', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    🗑 حذف حسابي
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'verification' && (isStudent || isInstructor) && (
            <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>🪪 التحقق من الهوية (KYC)</h3>
                {kycBadge()}
              </div>

              {kycStatus === 'verified' && (
                <p style={{ color: '#34d399' }}>✅ تم توثيق هويتك بنجاح.</p>
              )}
              {kycStatus === 'review_pending' && (
                <p style={{ color: 'rgba(255,255,255,0.6)' }}>⏳ طلبك قيد المراجعة من فريق الإدارة، عادة خلال 1-3 أيام عمل.</p>
              )}
              {kycStatus === 'age_flagged' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
                  <p style={{ color: '#f87171', fontSize: 13.5 }}>
                    ⚠️ تم تعليق التحقق من هويتك بسبب تعارض في العمر بين بيانات حسابك ووثيقتك.
                    لإعادة المحاولة، صحّح تاريخ ميلادك أدناه — ستحتاج موافقة ولي أمر لإتمام التصحيح،
                    وسيُقفل الدخول إلى حسابك مؤقتاً حتى موافقته.
                  </p>

                  {correctionSent ? (
                    <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: 16 }}>
                      <p style={{ color: '#34d399', fontWeight: 600, marginBottom: 6 }}>✅ تم إرسال طلب الموافقة لولي الأمر</p>
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13 }}>
                        بانتظار موافقته لإعادة فتح إمكانية رفع طلب التوثيق من جديد. سيتم تسجيل خروجك تلقائياً بجلستك القادمة لحين الموافقة.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="form-label">تاريخ الميلاد الصحيح</label>
                        <input className="form-input" type="date" value={correctionBirthDate} onChange={e => setCorrectionBirthDate(e.target.value)} />
                      </div>
                      <div>
                        <label className="form-label">بريد ولي الأمر الإلكتروني</label>
                        <input className="form-input" type="email" placeholder="parent@example.com" value={correctionGuardianEmail} onChange={e => setCorrectionGuardianEmail(e.target.value)} />
                      </div>
                      {correctionError && <div style={{ color: '#f87171', fontSize: 13 }}>⚠️ {correctionError}</div>}
                      <button className="btn-primary" style={{ width: 'fit-content' }} onClick={handleAgeCorrectionSubmit} disabled={correctionLoading}>
                        {correctionLoading ? '...جارٍ الإرسال' : 'إرسال طلب التصحيح'}
                      </button>
                    </>
                  )}
                </div>
              )}
              {(kycStatus === 'rejected' || kycStatus === 'not_submitted' || !kycStatus) && isInstructor && !mfaEnabled && (
                <div style={{ padding: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, marginBottom: 16 }}>
                  <p style={{ color: '#f87171', fontSize: 13.5, margin: 0 }}>يجب تفعيل التحقق الثنائي (2FA) من تبويب "الأمان" أولًا قبل تقديم طلب التوثيق.</p>
                </div>
              )}
              {(kycStatus === 'rejected' || kycStatus === 'not_submitted' || !kycStatus) && !(isInstructor && !mfaEnabled) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
                  {kycStatus === 'rejected' && (
                    <div style={{ padding: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, marginBottom: 16 }}>
                      <p style={{ color: '#f87171', fontSize: 13.5, margin: 0, fontWeight: 600 }}>❌ تم رفض طلبك السابق</p>
                      <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 13, margin: '6px 0 0' }}>
                        السبب: {latestRejectionReason
                          ? (REJECTION_REASON_LABELS[latestRejectionReason] || latestRejectionReason)
                          : 'غير محدَّد — الرجاء إعادة التقديم بمستندات واضحة.'}
                      </p>
                    </div>
                  )}
                  <div>
                    <label className="form-label">نوع الوثيقة</label>
                    <select className="form-input" value={idDocumentType} onChange={e => setIdDocumentType(e.target.value as 'national_id' | 'passport')}>
                      <option value="national_id">الهوية الوطنية</option>
                      <option value="passport">جواز السفر</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label">صورة الوثيقة</label>
                    <input type="file" accept="image/*" onChange={e => setIdFile(e.target.files?.[0] || null)} />
                    {idFile && <div style={{ fontSize: 12, color: '#4ade80', marginTop: 4 }}>✅ {idFile.name}</div>}
                  </div>
                  <div>
                    <label className="form-label">صورة سيلفي</label>
                    <input type="file" accept="image/*" onChange={e => setSelfieFile(e.target.files?.[0] || null)} />
                    {selfieFile && <div style={{ fontSize: 12, color: '#4ade80', marginTop: 4 }}>✅ {selfieFile.name}</div>}
                  </div>
                  {kycError && <div style={{ color: '#f87171', fontSize: 13 }}>⚠️ {kycError}</div>}
                  <button className="btn-primary" style={{ width: 'fit-content' }} onClick={handleKycSubmit} disabled={kycLoading}>
                    {kycLoading ? '...جارٍ الإرسال' : 'إرسال الطلب'}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'billing' && isStudent && (
            <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>💳 سجل المدفوعات</h3>
              </div>
              <div style={{ padding: '20px 24px' }}>
                <StudentPaymentsPanel />
              </div>
            </div>
          )}
        </div>
      </div>

      {deleteModalOpen && (
        <ModalPortal>
          <div
            onClick={() => !deleteLoading && setDeleteModalOpen(false)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}
          >
            <div onClick={e => e.stopPropagation()} style={{ background: 'rgba(12,4,45,0.98)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 20, padding: 26, maxWidth: 440, width: '100%' }}>
              {!deleteResult ? (
                <>
                  <h3 style={{ marginTop: 0, color: '#f87171' }}>⚠️ تأكيد حذف الحساب</h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 16 }}>
                    {isStudent
                      ? 'هذا الإجراء سيحذف حسابك فوراً. يمكنك استرجاعه خلال 30 يوماً من صفحة استرجاع الحساب فقط.'
                      : 'سيتم إرسال طلب حذف حسابك للإدارة للمراجعة، ولن يُحذف الحساب فوراً.'}
                  </p>
                  <div style={{ marginBottom: 14 }}>
                    <label className="form-label">سبب الحذف {isInstructor ? '(مطلوب لمراجعة الإدارة)' : '(اختياري)'}</label>
                    <textarea className="form-input" rows={3} value={deleteReason} onChange={e => setDeleteReason(e.target.value)} placeholder="اشرح باختصار سبب رغبتك بحذف الحساب..." disabled={deleteLoading} />
                  </div>
                  <div style={{ marginBottom: 18 }}>
                    <label className="form-label">اكتب <strong style={{ color: '#f87171' }}>حذف</strong> للتأكيد</label>
                    <input className="form-input" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} disabled={deleteLoading} />
                  </div>
                  {deleteError && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 14 }}>⚠️ {deleteError}</div>}
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button className="btn-outline" onClick={() => setDeleteModalOpen(false)} disabled={deleteLoading}>إلغاء</button>
                    <button
                      disabled={deleteLoading || deleteConfirmText.trim() !== 'حذف' || (isInstructor && !deleteReason.trim())}
                      onClick={handleConfirmDeleteAccount}
                      style={{
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)', border: 'none', borderRadius: 9999,
                        padding: '10px 22px', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                        opacity: (deleteLoading || deleteConfirmText.trim() !== 'حذف' || (isInstructor && !deleteReason.trim())) ? 0.5 : 1,
                      }}
                    >
                      {deleteLoading ? '...جارٍ الإرسال' : 'تأكيد الحذف'}
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>{deleteResult.immediate ? '✅' : '📨'}</div>
                  <h3 style={{ marginBottom: 8 }}>{deleteResult.immediate ? 'تم حذف حسابك' : 'تم إرسال طلب الحذف'}</h3>
                  <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', marginBottom: 20 }}>
                    {deleteResult.immediate
                      ? 'سيتم تسجيل خروجك الآن. يمكنك استرجاع حسابك خلال 30 يوماً إن غيّرت رأيك.'
                      : 'طلبك الآن قيد مراجعة الإدارة. حسابك يبقى نشطاً حتى صدور القرار.'}
                  </p>
                  {deleteResult.immediate
                    ? <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12.5 }}>...جارٍ تسجيل الخروج</div>
                    : <button className="btn-primary" onClick={() => setDeleteModalOpen(false)}>حسناً</button>}
                </div>
              )}
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  )
}