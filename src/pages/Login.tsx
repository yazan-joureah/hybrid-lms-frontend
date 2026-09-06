import { useState, useEffect } from 'react'
import { useNav, GUARDIAN_MANAGE_TOKEN_KEY } from '../context/NavContext'
import { useAuthApi, normalizeRole, computeFallbackPage, getCodeErrorMessage } from '../context/AuthApiContext'
import EdujarLogo from '../components/EdujarLogo'
import OtpInput from '../components/common/OtpInput'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

type OAuthView = 'none' | 'google-register' | 'google-link' | 'google-guardian'

export default function Login() {
  const { navigate, login, setUserName, setUserEmail } = useNav()
  const {
    login: apiLogin,
    verifyMfa: apiVerifyMfa,
    verifyEmail: apiVerifyEmail,
    resendVerification,
    googleLogin,
    googleRegisterConfirm,
    googleLinkConfirm,
    googleGuardianEmail,
    restoreSession,
    setPendingMfaToken,
    getErrorMessage,
  } = useAuthApi()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [error, setError] = useState('')

  // MFA
  const [mfaStep, setMfaStep] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaOtpKey, setMfaOtpKey] = useState(0)
  const [mfaError, setMfaError] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)
  const [backupCodeInput, setBackupCodeInput] = useState('')

  // Email Verification
  const [verifyEmailStep, setVerifyEmailStep] = useState(false)
  const [verifyEmailCode, setVerifyEmailCode] = useState('')
  const [verifyEmailOtpKey, setVerifyEmailOtpKey] = useState(0)
  const [verifyEmailError, setVerifyEmailError] = useState('')
  const [cooldown, setCooldown] = useState(0)

  // Google OAuth flows
  const [oauthView, setOauthView] = useState<OAuthView>('none')
  const [oauthToken, setOauthToken] = useState('')
  const [oauthLoading, setOauthLoading] = useState(false)
  const [oauthError, setOauthError] = useState('')
  const [googleRestoring, setGoogleRestoring] = useState(false)

  const [birthDate, setBirthDate] = useState('')
  const [oauthRole, setOauthRole] = useState<'Student' | 'Instructor'>('Student')
  const [linkPassword, setLinkPassword] = useState('')
  const [guardianEmail, setGuardianEmail] = useState('')
  const [oauthGuardianSent, setOauthGuardianSent] = useState(false)

  const emailValid = EMAIL_RE.test(email)

  const applyLoggedInUser = (user: any) => {
    const role = normalizeRole(user?.role)
    login(role)
    setUserName(user?.full_name || email.trim().split('@')[0] || 'مستخدم')
    setUserEmail(user?.email || email.trim().toLowerCase())
    navigate(computeFallbackPage(user))
  }

  const cleanUrl = () => {
    window.history.replaceState({}, '', window.location.pathname)
  }

  // استعادة جلسة Google
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const step = params.get('oauth_step')
    const token = params.get('token')
    const err = params.get('oauth_error')
    const googleSuccess = params.get('auth') === 'google_success'

    if (err) {
      setError(decodeURIComponent(err))
      cleanUrl()
      return
    }

    if (step === 'mfa' && token) {
      setPendingMfaToken(token)
      setMfaStep(true)
      cleanUrl()
      return
    }

    if (step === 'google-register' && token) {
      setOauthToken(token)
      setOauthView('google-register')
      cleanUrl()
      return
    }

    if (step === 'google-link' && token) {
      setOauthToken(token)
      setOauthView('google-link')
      cleanUrl()
      return
    }

    if (step === 'guardian-pending' && token) {
      sessionStorage.setItem(GUARDIAN_MANAGE_TOKEN_KEY, token)
      navigate('guardian-manage')
      cleanUrl()
      return
    }

    if (googleSuccess) {
      setGoogleRestoring(true)
      restoreSession().then((res) => {
        setGoogleRestoring(false)
        cleanUrl()
        if (res.success && res.user) {
          applyLoggedInUser(res.user)
        } else {
          setError('تعذّر استكمال تسجيل الدخول عبر Google. حاول مجدداً.')
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleLogin = async () => {
    setEmailTouched(true)
    setError('')

    if (!emailValid) {
      setError('يرجى إدخال بريد إلكتروني صحيح قبل المتابعة')
      return
    }
    if (!password) {
      setError('يرجى إدخال كلمة المرور')
      return
    }

    setLoading(true)
    try {
      const result = await apiLogin(email.trim().toLowerCase(), password)
      if (result.mfaRequired) {
        setMfaStep(true)
      } else if (result.guardianPending) {
        if (result.guardianManageToken) {
          sessionStorage.setItem(GUARDIAN_MANAGE_TOKEN_KEY, result.guardianManageToken)
          navigate('guardian-manage')
        } else {
          setError('حسابك بانتظار موافقة ولي الأمر. تحقق من بريدك الإلكتروني للتفاصيل.')
        }
      } else if (result.requiresEmailVerification) {
        // الحالة الجديدة: تفعيل البريد الإلكتروني
        setVerifyEmailStep(true)
      } else if (result.user) {
        applyLoggedInUser(result.user)
      }
    } catch (err) {
      const message = getErrorMessage(err)
      // التحقق مما إذا كان الخطأ هو "الحساب غير مفعل" ليعرض واجهة التفعيل
      if (message.includes('تحقق') || message.includes('غير مفعل')) {
        setVerifyEmailStep(true)
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  // دالة التحقق من رمز البريد
  const handleVerifyEmail = async () => {
    if (verifyEmailCode.length !== 6) {
      setVerifyEmailError('أدخل الرمز المكوّن من 6 أرقام كاملاً')
      return
    }
    setVerifyEmailError('')
    setLoading(true)
    try {
      const result = await apiVerifyEmail(email.trim().toLowerCase(), verifyEmailCode)
      if (result?.nextStep === 'guardian_pending') {
        setError('تم التحقق! حسابك بانتظار موافقة ولي الأمر.')
      } else {
        setError('تم تفعيل حسابك بنجاح! يمكنك تسجيل الدخول الآن.')
      }
      setVerifyEmailStep(false)
      setVerifyEmailCode('')
      setPassword('')
    } catch (err) {
      setVerifyEmailError(getCodeErrorMessage(err, getErrorMessage(err)))
      setVerifyEmailCode('')
      setVerifyEmailOtpKey(k => k + 1)
    } finally {
      setLoading(false)
    }
  }

  // دالة إعادة إرسال الرمز
  const handleResend = async () => {
    if (cooldown > 0) return
    setLoading(true)
    try {
      await resendVerification(email.trim().toLowerCase())
      setCooldown(60)
      const iv = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) { clearInterval(iv); return 0 }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      setVerifyEmailError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleMfaVerify = async () => {
    const codeToSend = useBackupCode ? backupCodeInput.trim() : mfaCode
    if (!useBackupCode && mfaCode.length !== 6) {
      setMfaError('أدخل الرمز المكوّن من 6 أرقام كاملاً')
      return
    }
    if (useBackupCode && codeToSend.length < 6) {
      setMfaError('أدخل رمز النسخ الاحتياطي كاملاً')
      return
    }
    setMfaError('')
    setLoading(true)
    try {
      const result = await apiVerifyMfa(codeToSend)
      if (result.user) applyLoggedInUser(result.user)
    } catch (err) {
      setMfaError(getErrorMessage(err))
      setMfaCode('')
      setBackupCodeInput('')
      setMfaOtpKey(k => k + 1)
    } finally {
      setLoading(false)
    }
  }

  // Google flows
  const handleGoogleRegisterSubmit = async () => {
    if (!birthDate) {
      setOauthError('اختر تاريخ الميلاد')
      return
    }
    setOauthError('')
    setOauthLoading(true)
    try {
      const result = await googleRegisterConfirm(oauthToken, birthDate, oauthRole)
      if (result.requiresGuardianEmail && result.guardianPendingToken) {
        setOauthToken(result.guardianPendingToken)
        setOauthView('google-guardian')
      } else if (result.user) {
        applyLoggedInUser(result.user)
      }
    } catch (err) {
      setOauthError(getErrorMessage(err))
    } finally {
      setOauthLoading(false)
    }
  }

  const handleGoogleLinkSubmit = async () => {
    if (!linkPassword) {
      setOauthError('أدخل كلمة المرور')
      return
    }
    setOauthError('')
    setOauthLoading(true)
    try {
      const result = await googleLinkConfirm(oauthToken, linkPassword)
      if (result.user) applyLoggedInUser(result.user)
    } catch (err) {
      setOauthError(getErrorMessage(err))
    } finally {
      setOauthLoading(false)
    }
  }

  const handleGoogleGuardianSubmit = async () => {
    if (!guardianEmail.trim()) {
      setOauthError('أدخل بريد ولي الأمر')
      return
    }
    setOauthError('')
    setOauthLoading(true)
    try {
      await googleGuardianEmail(oauthToken, guardianEmail.trim())
      setOauthView('none')
      setOauthGuardianSent(true)
    } catch (err) {
      setOauthError(getErrorMessage(err))
    } finally {
      setOauthLoading(false)
    }
  }

  const resetOauthFlow = () => {
    setOauthView('none')
    setOauthToken('')
    setOauthError('')
    setBirthDate('')
    setOauthRole('Student')
    setLinkPassword('')
    setGuardianEmail('')
    setOauthGuardianSent(false)
  }

  if (googleRestoring) {
    return (
      <div className="auth-shell">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>⏳</div>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>جارٍ إكمال تسجيل الدخول عبر Google...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh', direction: 'rtl',
      background: 'linear-gradient(135deg, #080320 0%, #1a0550 40%, #0d0340 100%)',
      display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
    }}>
      {/* الخلفية المتوهجة */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '15%', right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '8%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.16) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', top: '60%', right: '45%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)' }} />
      </div>

      <div className="auth-header">
        <button onClick={() => navigate('landing')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <EdujarLogo width={130} height={34} />
        </button>
        <button className="btn-ghost" onClick={() => navigate('landing')}>الرئيسية</button>
      </div>

      <div className="auth-content">
        <div className="auth-card" style={{ maxWidth: 460 }}>
          {/* Google OAuth sub-flow: Register */}
          {oauthView === 'google-register' && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🎂</div>
                <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>خطوة أخيرة</h1>
                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', margin: 0 }}>نحتاج تاريخ ميلادك ونوع الحساب لإتمام إنشاء حسابك</p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="form-label">نوع الحساب</label>
                <div style={{ display: 'flex', gap: 16, marginTop: 6 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="oauthRole"
                      value="Student"
                      checked={oauthRole === 'Student'}
                      onChange={() => setOauthRole('Student')}
                      disabled={oauthLoading}
                    />
                    طالب
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="oauthRole"
                      value="Instructor"
                      checked={oauthRole === 'Instructor'}
                      onChange={() => setOauthRole('Instructor')}
                      disabled={oauthLoading}
                    />
                    مدرّس
                  </label>
                </div>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="form-label">تاريخ الميلاد</label>
                <input className="form-input" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} disabled={oauthLoading} />
              </div>

              {oauthError && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 14 }}>⚠️ {oauthError}</div>}
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15 }} onClick={handleGoogleRegisterSubmit} disabled={oauthLoading}>
                {oauthLoading ? '...جارٍ الحفظ' : 'إكمال التسجيل'}
              </button>
              <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} onClick={resetOauthFlow}>
                ← العودة لتسجيل الدخول
              </button>
            </div>
          )}

          {/* Google OAuth sub-flow: Link */}
          {oauthView === 'google-link' && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔗</div>
                <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>ربط الحساب</h1>
                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', margin: 0 }}>عندك حساب مسجل بهاد الإيميل مسبقاً. أدخل كلمة المرور لربطه بحساب Google</p>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">كلمة المرور</label>
                <input className="form-input" type="password" placeholder="••••••••" value={linkPassword} onChange={e => setLinkPassword(e.target.value)} disabled={oauthLoading} />
              </div>
              {oauthError && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 14 }}>⚠️ {oauthError}</div>}
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15 }} onClick={handleGoogleLinkSubmit} disabled={oauthLoading}>
                {oauthLoading ? '...جارٍ الربط' : 'ربط الحساب'}
              </button>
              <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: 10 }} onClick={resetOauthFlow}>
                ← العودة لتسجيل الدخول
              </button>
            </div>
          )}

          {/* Google OAuth sub-flow: Guardian */}
          {oauthView === 'google-guardian' && (
            <div style={{ textAlign: 'right' }}>
              {!oauthGuardianSent ? (
                <>
                  <div style={{ textAlign: 'center', marginBottom: 20 }}>
                    <div style={{ fontSize: 36, marginBottom: 12 }}>👪</div>
                    <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>مطلوب موافقة ولي الأمر</h1>
                    <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', margin: 0 }}>بما إنك دون 18 عاماً، لازم بريد ولي أمرك للموافقة على الحساب</p>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label">بريد ولي الأمر</label>
                    <input className="form-input" type="email" placeholder="parent@example.com" value={guardianEmail} onChange={e => setGuardianEmail(e.target.value)} disabled={oauthLoading} />
                  </div>
                  {oauthError && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 14 }}>⚠️ {oauthError}</div>}
                  <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15 }} onClick={handleGoogleGuardianSubmit} disabled={oauthLoading}>
                    {oauthLoading ? '...جارٍ الإرسال' : 'إرسال الطلب'}
                  </button>
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div style={{ fontSize: 36, marginBottom: 12 }}>✅</div>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', marginBottom: 20 }}>
                    تم إرسال طلب الموافقة لولي الأمر. بانتظار موافقته لتفعيل الحساب.
                  </p>
                  <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15 }} onClick={resetOauthFlow}>
                    العودة لتسجيل الدخول
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Normal login */}
          {oauthView === 'none' && !mfaStep && !verifyEmailStep && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%',
                  border: '2px dashed rgba(255,255,255,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  margin: '0 auto 16px', fontSize: 26,
                }}>☀</div>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px' }}>
                  مرحباً بعودتك إلى <span className="gradient-text">Hybrid LMS!</span>
                </h1>
                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                  سجّل دخولك للوصول إلى كورساتك
                </p>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label className="form-label">البريد الإلكتروني</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="أدخل بريدك الإلكتروني"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onBlur={() => setEmailTouched(true)}
                  style={{ borderColor: emailTouched && email && !emailValid ? '#ef4444' : undefined }}
                />
                {emailTouched && email && !emailValid && (
                  <div style={{ fontSize: 12, color: '#f87171', marginTop: 5 }}>يرجى إدخال بريد إلكتروني صحيح (مثال: name@example.com)</div>
                )}
              </div>

              <div style={{ marginBottom: 8 }}>
                <label className="form-label">كلمة المرور</label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="form-input"
                    type={showPass ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    style={{ paddingLeft: 44 }}
                  />
                  <button
                    onClick={() => setShowPass(!showPass)}
                    style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 16 }}
                  >{showPass ? '🙈' : '👁'}</button>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                  <div
                    onClick={() => setRemember(!remember)}
                    style={{
                      width: 18, height: 18, borderRadius: 5,
                      background: remember ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'transparent',
                      border: remember ? 'none' : '1.5px solid rgba(255,255,255,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', flexShrink: 0,
                    }}
                  >{remember && <span style={{ color: '#fff', fontSize: 11, fontWeight: 700 }}>✓</span>}</div>
                  تذكرني
                </label>
                <button className="btn-ghost" style={{ fontSize: 13, color: '#a855f7', padding: '4px 8px' }} onClick={() => navigate('forgot-password')}>
                  نسيت كلمة المرور؟
                </button>
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 16 }}>
                  ⚠️ {error}
                </div>
              )}

              <button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 16, marginBottom: 16 }}
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? '...جارٍ تسجيل الدخول' : 'تسجيل الدخول'}
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>أو</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
              </div>

              <button
                onClick={googleLogin}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  background: 'rgba(255,255,255,0.06)', border: '1.5px solid rgba(255,255,255,0.12)',
                  borderRadius: 9999, padding: '12px', color: '#fff', fontSize: 15, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s',
                }}>
                <span>G</span> تسجيل الدخول بـ Google
              </button>

              <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13.5, color: 'rgba(255,255,255,0.5)' }}>
                ليس لديك حساب؟{' '}
                <button className="btn-ghost" style={{ color: '#a855f7', fontWeight: 700, fontSize: 13.5, padding: '2px 4px' }} onClick={() => navigate('register')}>
                  سجّل الآن
                </button>
              </div>
            </>
          )}

          {/* Email Verification Step */}
          {oauthView === 'none' && !mfaStep && verifyEmailStep && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📧</div>
                <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>تفعيل حسابك</h1>
                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                  أدخل الرمز المكوّن من 6 أرقام المرسل إلى<br />
                  <span style={{ color: '#a855f7', fontWeight: 600 }}>{email}</span>
                </p>
              </div>

              <div style={{ marginBottom: 6 }}>
                <OtpInput key={verifyEmailOtpKey} onComplete={setVerifyEmailCode} error={!!verifyEmailError} disabled={loading} />
              </div>

              {verifyEmailError && <div style={{ textAlign: 'center', color: '#f87171', fontSize: 13, marginBottom: 12, marginTop: 4 }}>{verifyEmailError}</div>}

              <button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, marginTop: 20, marginBottom: 10 }}
                onClick={handleVerifyEmail}
                disabled={loading}
              >
                {loading ? '...جارٍ التحقق' : 'تفعيل الحساب'}
              </button>

              <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                <button className="btn-ghost" style={{ fontSize: 13, color: '#a855f7', padding: '4px 8px' }} onClick={handleResend} disabled={cooldown > 0 || loading}>
                  {cooldown > 0 ? `إعادة الإرسال خلال ${cooldown}s` : 'لم يصلك الرمز؟ إعادة الإرسال'}
                </button>
              </div>

              <button
                className="btn-ghost"
                style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}
                onClick={() => {
                  setVerifyEmailStep(false)
                  setVerifyEmailCode('')
                  setVerifyEmailError('')
                  setError('')
                  setPassword('')
                }}
              >
                ← العودة لتسجيل الدخول
              </button>
            </>
          )}

          {/* MFA step */}
          {oauthView === 'none' && mfaStep && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔒</div>
                <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>التحقق بخطوتين</h1>
                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', margin: 0 }}>أدخل الرمز المكوّن من 6 أرقام من تطبيق المصادقة</p>
              </div>

              <div style={{ marginBottom: 6 }}>
                {useBackupCode ? (
                  <input
                    className="form-input"
                    style={{ textAlign: 'center', letterSpacing: 2, fontFamily: 'monospace' }}
                    placeholder="أدخل رمز النسخ الاحتياطي"
                    value={backupCodeInput}
                    onChange={e => setBackupCodeInput(e.target.value.trim())}
                    disabled={loading}
                    autoFocus
                  />
                ) : (
                  <OtpInput key={mfaOtpKey} onComplete={setMfaCode} error={!!mfaError} disabled={loading} />
                )}
              </div>

              {mfaError && <div style={{ textAlign: 'center', color: '#f87171', fontSize: 13, marginBottom: 12, marginTop: 4 }}>{mfaError}</div>}

              <button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, marginTop: 20, marginBottom: 10 }}
                onClick={handleMfaVerify}
                disabled={loading}
              >
                {loading ? '...جارٍ التحقق' : 'تحقق ودخول'}
              </button>
              <button
                className="btn-ghost"
                style={{ width: '100%', justifyContent: 'center', fontSize: 12.5 }}
                onClick={() => {
                  setUseBackupCode(v => !v)
                  setMfaError('')
                  setMfaCode('')
                  setBackupCodeInput('')
                  setMfaOtpKey(k => k + 1)
                }}
              >
                {useBackupCode ? '← استخدام تطبيق المصادقة بدلاً من ذلك' : 'فقدت جهازك؟ استخدم رمز نسخ احتياطي'}
              </button>
              <button
                className="btn-ghost"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => {
                  setMfaStep(false)
                  setMfaCode('')
                  setBackupCodeInput('')
                  setUseBackupCode(false)
                  setMfaOtpKey(k => k + 1)
                  setMfaError('')
                }}
              >
                ← رجوع لتسجيل الدخول
              </button>
            </>
          )}
        </div>
      </div>

      <div style={{ padding: '16px 28px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 12 }}>© 2026 Hybrid LMS. جميع الحقوق محفوظة. | سياسة الخصوصية | شروط الخدمة</p>
      </div>
    </div>
  )
}