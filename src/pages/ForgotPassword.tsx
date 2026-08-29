import { useState } from 'react'
import { useNav } from '../context/NavContext'
import { useAuthApi, getCodeErrorMessage } from '../context/AuthApiContext'
import EdujarLogo from '../components/EdujarLogo'
import OtpInput from '../components/common/OtpInput'

type Step = 'email' | 'otp' | 'newpass' | 'success'

export default function ForgotPassword() {
  const { navigate } = useNav()
  const { forgotPassword, resetPassword, getErrorMessage } = useAuthApi()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [otpKey, setOtpKey] = useState(0)
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [timer, setTimer] = useState(60)
  const [timerActive, setTimerActive] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [passError, setPassError] = useState('')
  const [loading, setLoading] = useState(false)

  const startTimer = () => {
    setTimerActive(true)
    let t = 60
    const iv = setInterval(() => {
      t--
      setTimer(t)
      if (t <= 0) { clearInterval(iv); setTimerActive(false) }
    }, 1000)
  }

  const handleEmailSubmit = async () => {
    if (!email.trim()) return
    setLoading(true)
    try {
      await forgotPassword(email.trim().toLowerCase())
      setStep('otp')
      setTimer(60)
      startTimer()
    } catch (err) {
      // الباك بيرجع نفس الرسالة سواء الإيميل موجود أو لأ (لأسباب أمنية)،
      // فبنعرض أي خطأ فعلي بس (شبكة، سيرفر...) وبنكمل بشكل طبيعي غير هيك
      setOtpError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }


  // ما في endpoint مستقل للتحقق من الرمز لحاله بالباك — التحقق الفعلي بيصير
  // مع إرسال كلمة المرور الجديدة بخطوة newpass. هون بس منتأكد إنه المستخدم
  // دخل 6 أرقام قبل ما ينتقل.
  const handleContinueToNewPass = () => {
    if (code.length !== 6) {
      setOtpError('أدخل الرمز المكوّن من 6 أرقام كاملاً')
      return
    }
    setOtpError('')
    setStep('newpass')
  }

  const handleResetSubmit = async () => {
    if (newPass !== confirmPass) {
      setPassError('كلمتا المرور غير متطابقتين')
      return
    }
    if (newPass.length < 6) {
      setPassError('كلمة المرور يجب أن تكون 6 أحرف على الأقل')
      return
    }
    setPassError('')
    setLoading(true)
    try {
      await resetPassword(email.trim().toLowerCase(), code, newPass)
      setStep('success')
    } catch (err: any) {
      // نفس منطق كود صاحبك بالضبط: يشيك على كود الخطأ (INVALID_CODE / CODE_EXPIRED / TOO_MANY_ATTEMPTS)
      const errorCode = err?.response?.data?.error?.code
      if (errorCode === 'INVALID_CODE' || errorCode === 'CODE_EXPIRED' || errorCode === 'TOO_MANY_ATTEMPTS') {
        setStep('otp')
        setCode('')
        setOtpKey(k => k + 1)
        setOtpError(getCodeErrorMessage(err, ''))
      } else {
        setPassError(getErrorMessage(err))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (timerActive || loading) return
    setLoading(true)
    try {
      await forgotPassword(email.trim().toLowerCase())
      setTimer(60)
      setCode('')
      setOtpKey(k => k + 1)
      startTimer()
    } catch (err) {
      setOtpError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const strength = newPass.length === 0 ? 0 : newPass.length < 6 ? 1 : newPass.length < 10 ? 2 : 3
  const strengthColors = ['', '#ef4444', '#f59e0b', '#10b981']
  const strengthLabels = ['', 'ضعيفة', 'مقبولة', 'قوية']

  return (
    <div className="auth-shell">
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '20%', right: '15%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '20%', left: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)' }} />
      </div>

      <div className="auth-header">
        <button onClick={() => navigate('landing')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <EdujarLogo width={130} height={34} />
        </button>
      </div>

      <div className="auth-content">
        <div className="auth-card" style={{ maxWidth: 440 }}>
          {step === 'email' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔐</div>
                <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>نسيت كلمة المرور؟</h1>
                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', margin: 0 }}>سنرسل لك رمز تحقق على بريدك الإلكتروني</p>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">البريد الإلكتروني</label>
                <input className="form-input" type="email" placeholder="أدخل بريدك الإلكتروني" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              {otpError && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 16 }}>
                  ⚠️ {otpError}
                </div>
              )}
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, marginBottom: 14 }} onClick={handleEmailSubmit} disabled={loading}>
                {loading ? '...جارٍ الإرسال' : 'إرسال رمز التحقق'}
              </button>
              <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('login')}>
                ← العودة لتسجيل الدخول
              </button>
            </>
          )}

          {step === 'otp' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📧</div>
                <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>أدخل رمز التحقق</h1>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                  أرسلنا رمزاً من 6 أرقام إلى<br />
                  <span style={{ color: '#a855f7', fontWeight: 600 }}>{email}</span>
                </p>
              </div>

              <div style={{ marginBottom: 6 }}>
                <OtpInput key={otpKey} onComplete={setCode} error={!!otpError} disabled={loading} />
              </div>

              {otpError && <div style={{ textAlign: 'center', color: '#f87171', fontSize: 13, marginBottom: 12, marginTop: 4 }}>{otpError}</div>}

              <div style={{ textAlign: 'center', marginBottom: 20, marginTop: 12, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                {timerActive
                  ? <>انتهاء صلاحية الرمز خلال <span style={{ color: '#a855f7', fontWeight: 600 }}>{timer}s</span></>
                  : <button className="btn-ghost" style={{ fontSize: 13, color: '#a855f7', padding: '4px 8px' }} onClick={handleResendCode} disabled={loading}>إعادة إرسال الرمز</button>
                }
              </div>

              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, marginBottom: 10 }} onClick={handleContinueToNewPass}>
                تحقق من الرمز
              </button>
              <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setStep('email')}>← رجوع</button>
            </>
          )}

          {step === 'newpass' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔑</div>
                <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>كلمة مرور جديدة</h1>
                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', margin: 0 }}>اختر كلمة مرور قوية لحسابك</p>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">كلمة المرور الجديدة</label>
                <input className="form-input" type="password" placeholder="••••••••" value={newPass} onChange={e => setNewPass(e.target.value)} />
                {newPass.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {[1, 2, 3].map(i => (
                        <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: strength >= i ? strengthColors[strength] : 'rgba(255,255,255,0.1)', transition: 'background 0.2s' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 11.5, color: strengthColors[strength] }}>{strengthLabels[strength]}</span>
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">تأكيد كلمة المرور</label>
                <input className="form-input" type="password" placeholder="••••••••" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} />
              </div>

              {passError && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 16 }}>
                  ⚠️ {passError}
                </div>
              )}

              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15 }} onClick={handleResetSubmit} disabled={loading}>
                {loading ? '...جارٍ الحفظ' : 'حفظ كلمة المرور'}
              </button>
            </>
          )}

          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 10px' }}>تم بنجاح!</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: '0 0 28px' }}>تم تغيير كلمة مرورك بنجاح. يمكنك الآن تسجيل الدخول.</p>
              <button className="btn-primary" style={{ justifyContent: 'center', padding: '13px 36px', fontSize: 15 }} onClick={() => navigate('login')}>
                العودة لتسجيل الدخول
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
