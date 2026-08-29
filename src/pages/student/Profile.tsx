import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { useNav } from '../../context/NavContext'
import { useAuthApi } from '../../context/AuthApiContext'
import { StudentPaymentsPanel } from '../payments/student/StudentPaymentsPanel'

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

export default function Profile() {
  const { userName, setUserName, userEmail, setUserEmail, userPhone, setUserPhone, userDob, setUserDob, userBio, setUserBio, userGender, setUserGender } = useNav()
  const { getCurrentUser, setupMfa, confirmMfa, getErrorMessage, uploadProfilePicture, getProfilePictureUrl, submitKyc } = useAuthApi()

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
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [backendRole, setBackendRole] = useState<BackendRole | null>(null)
  const [kycStatus, setKycStatus] = useState<string | null>(null)
  const [mfaEnabled, setMfaEnabled] = useState<boolean | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)

  // رفع الصورة — حقيقي هلق
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null) // معاينة فورية أثناء الرفع
  const [avatarBust, setAvatarBust] = useState(0) // لتجديد الصورة من السيرفر بعد الرفع (تجاوز الكاش)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarError, setAvatarError] = useState('')

  const [mfaActionLoading, setMfaActionLoading] = useState(false)
  const [mfaError, setMfaError] = useState('')
  const [totpSetup, setTotpSetup] = useState({ active: false, qrCode: '', secret: '' })
  const [totpCode, setTotpCode] = useState('')
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null)

  // ---------- KYC (تبويب التحقق) ----------
  const [idDocumentType, setIdDocumentType] = useState<'national_id' | 'passport'>('national_id')
  const [idFile, setIdFile] = useState<File | null>(null)
  const [selfieFile, setSelfieFile] = useState<File | null>(null)
  const [kycLoading, setKycLoading] = useState(false)
  const [kycError, setKycError] = useState('')

  useEffect(() => {
    setName(userName || 'أحمد محمد الأحمد')
    setEmail(userEmail || '')
    setPhone(userPhone || '')
    setDob(userDob || '')
    setBio(userBio || '')
    setGender(userGender || 'male')
  }, [userName, userEmail, userPhone, userDob, userBio, userGender])

  const loadUser = () => {
    return getCurrentUser().then((u) => {
      setUserId(u.id || null)
      setBackendRole((u.role as BackendRole) || 'Student')
      setKycStatus(u.kyc_status || 'not_submitted')
      setMfaEnabled(!!u.mfa_enabled)
    })
  }

  useEffect(() => {
    let cancelled = false
    setProfileLoading(true)
    loadUser()
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

  const handleSave = () => {
    setUserName(name)
    setUserEmail(email)
    setUserPhone(phone)
    setUserDob(dob)
    setUserBio(bio)
    setUserGender(gender)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
    // ⚠️ باقي حقول الملف (phone/dob/bio/gender) لسا ما إلها endpoint تحديث
    // مؤكد بالباك — هاي بس بتحدّث الـ NavContext المحلي، مو السيرفر.
  }

  // ---------- رفع صورة حقيقي ----------
  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setAvatarError('')

    // معاينة فورية بينما الرفع شغّال
    const localUrl = URL.createObjectURL(file)
    setAvatarPreview(localUrl)

    setUploadingAvatar(true)
    try {
      await uploadProfilePicture(file)
      setAvatarBust((n) => n + 1) // إجبار إعادة تحميل الصورة الحقيقية من السيرفر
    } catch (err) {
      setAvatarError(getErrorMessage(err))
      setAvatarPreview(null) // رجوع للأفتار الافتراضي لو فشل الرفع
    } finally {
      setUploadingAvatar(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const openFilePicker = () => fileInputRef.current?.click()

  const avatarSrc = avatarPreview
    ? avatarPreview
    : userId
      ? `${getProfilePictureUrl(userId)}?v=${avatarBust}`
      : null

  // ---------- MFA (زي ما هي) ----------
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
      await submitKyc({ idDocumentType, idDocumentFile: idFile, selfieFile })
      await loadUser() // تحديث kycStatus الحقيقي (رح يصير review_pending)
      setIdFile(null)
      setSelfieFile(null)
    } catch (err: any) {
      const code = err?.response?.data?.error?.code
      setKycError(KYC_ERROR_MESSAGES[code] || getErrorMessage(err))
    } finally {
      setKycLoading(false)
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
                  <input className="form-input" type="date" value={dob} onChange={e => setDob(e.target.value)} />
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">نبذة شخصية</label>
                <textarea className="form-input" rows={3} value={bio} onChange={e => setBio(e.target.value)} placeholder="أنا طالب أحب تعلم تطوير الويب" style={{ resize: 'none' }} />
              </div>
              <button className="btn-primary" style={{ padding: '11px 28px', fontSize: 14 }} onClick={handleSave}>
                {saved ? '✓ تم الحفظ' : 'حفظ التغييرات'}
              </button>
              <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.35)', marginTop: 10 }}>
                ⚠️ حفظ رقم الهاتف/تاريخ الميلاد/النبذة محلي حاليًا فقط — بانتظار endpoint تحديث ملف شخصي من الباك.
              </p>
            </div>
          )}

          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '24px' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 18px' }}>🔑 تغيير كلمة المرور</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 400 }}>
                  <div><label className="form-label">كلمة المرور الحالية</label><input className="form-input" type="password" placeholder="••••••••" /></div>
                  <div><label className="form-label">كلمة المرور الجديدة</label><input className="form-input" type="password" placeholder="••••••••" /></div>
                  <div><label className="form-label">تأكيد كلمة المرور</label><input className="form-input" type="password" placeholder="••••••••" /></div>
                  <button className="btn-primary" style={{ padding: '11px 24px', fontSize: 14, width: 'fit-content' }} disabled>تحديث كلمة المرور (قيد الإنجاز)</button>
                </div>
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
                  <div style={{ marginTop: 14, padding: '14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12 }}>
                    <div style={{ fontSize: 13.5, color: '#fbbf24', fontWeight: 700, marginBottom: 8 }}>✓ تم التفعيل! احتفظ برموز الاسترجاع هاي بمكان آمن</div>
                    <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#fff', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
                      {backupCodes.map((c) => <span key={c}>{c}</span>)}
                    </div>
                    <button className="btn-secondary" onClick={() => setBackupCodes(null)}>فهمت، إخفاء</button>
                  </div>
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
                <p style={{ color: '#f87171' }}>⚠️ تم تعليق حسابك تلقائيًا بسبب تعارض بالعمر بين بيانات حسابك والوثيقة. تواصل مع الدعم.</p>
              )}
              {(kycStatus === 'rejected' || kycStatus === 'not_submitted' || !kycStatus) && isInstructor && !mfaEnabled && (
                <div style={{ padding: 14, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, marginBottom: 16 }}>
                  <p style={{ color: '#f87171', fontSize: 13.5, margin: 0 }}>يجب تفعيل التحقق الثنائي (2FA) من تبويب "الأمان" أولًا قبل تقديم طلب التوثيق.</p>
                </div>
              )}
              {(kycStatus === 'rejected' || kycStatus === 'not_submitted' || !kycStatus) && !(isInstructor && !mfaEnabled) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 480 }}>
                  {kycStatus === 'rejected' && (
                    <p style={{ color: '#f87171', fontSize: 13.5 }}>❌ تم رفض طلبك السابق. الرجاء إعادة التقديم بمستندات واضحة.</p>
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
    </div>
  )
}