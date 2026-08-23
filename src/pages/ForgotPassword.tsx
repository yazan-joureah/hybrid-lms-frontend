import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { getErrorMessage } from '../utils/errorMessages'
import EdujarLogo from '../components/EdujarLogo'

type Step = 'email' | 'otp' | 'newpass' | 'success'

export default function ForgotPassword() {
  const { forgotPassword, resetPassword } = useAuth()
  const { showMsg } = useToast()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [newPass, setNewPass] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [timer, setTimer] = useState(60)
  const [timerActive, setTimerActive] = useState(false)
  const [otpError, setOtpError] = useState('')
  const [loading, setLoading] = useState(false)

  const startTimer = () => {
    setTimerActive(true)
    let t = 60
    setTimer(60)
    const iv = setInterval(() => {
      t--
      setTimer(t)
      if (t <= 0) { clearInterval(iv); setTimerActive(false) }
    }, 1000)
  }

  const handleEmailSubmit = async () => {
    if (!email.trim()) {
      showMsg('يرجى إدخال بريدك الإلكتروني', 'error')
      return
    }
    setLoading(true)
    try {
      await forgotPassword(email.trim().toLowerCase())
      showMsg('تم إرسال رمز التحقق (إن كان البريد مسجلاً لدينا).', 'success')
      setStep('otp')
      startTimer()
    } catch (err) {
      showMsg(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleOTPInput = (idx: number, val: string) => {
    if (val.length > 1) return
    const next = [...otp]
    next[idx] = val
    setOtp(next)
    if (val && idx < 5) {
      document.getElementById(`otp-${idx + 1}`)?.focus()
    }
  }

  const handleVerifyOTP = () => {
    const code = otp.join('')
    if (code.length !== 6) {
      setOtpError('يرجى إدخال الرمز المكوّن من 6 أرقام كاملاً')
      return
    }
    setOtpError('')
    // The code is verified together with the new password on the final step,
    // since the backend's /auth/reset-password endpoint validates both at once.
    setStep('newpass')
  }

  const handleResend = async () => {
    if (timerActive) return
    setLoading(true)
    try {
      await forgotPassword(email.trim().toLowerCase())
      showMsg('تم إرسال رمز جديد إلى بريدك الإلكتروني.', 'success')
      startTimer()
    } catch (err) {
      showMsg(getErrorMessage(err), 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async () => {
    if (newPass.length < 6) {
      showMsg('يجب أن تتكون كلمة المرور من 6 أحرف على الأقل', 'error')
      return
    }
    if (newPass !== confirmPass) {
      showMsg('كلمتا المرور غير متطابقتين', 'error')
      return
    }
    setLoading(true)
    try {
      await resetPassword(email.trim().toLowerCase(), otp.join(''), newPass)
      setStep('success')
    } catch (err: any) {
      const errorCode = err?.response?.data?.error?.code
      const msg = getErrorMessage(err)
      showMsg(msg, 'error')
      if (errorCode === 'INVALID_CODE' || errorCode === 'CODE_EXPIRED' || errorCode === 'TOO_MANY_ATTEMPTS') {
        // Send them back to re-enter (or re-request) the code.
        setOtpError(msg)
        setStep('otp')
      }
    } finally {
      setLoading(false)
    }
  }

  const strength = newPass.length === 0 ? 0 : newPass.length < 6 ? 1 : newPass.length < 10 ? 2 : 3
  const strengthColors = ['', '#ef4444', '#f59e0b', '#10b981']
  const strengthLabels = ['', 'ضعيفة', 'مقبولة', 'قوية']

  return (
    <div style={{
      minHeight: '100vh', direction: 'rtl',
      background: 'linear-gradient(135deg, #080320 0%, #1a0550 40%, #0d0340 100%)',
      display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '20%', right: '15%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.18) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '20%', left: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)' }} />
      </div>

      <div style={{ padding: '20px 28px', position: 'relative', zIndex: 1 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <EdujarLogo width={130} height={34} />
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px', position: 'relative', zIndex: 1 }}>
        <div style={{
          width: '100%', maxWidth: 440,
          background: 'rgba(16,6,52,0.85)', backdropFilter: 'blur(28px)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24,
          padding: '40px 36px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)',
        }}>
          {step === 'email' && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>🔐</div>
                <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>نسيت كلمة المرور؟</h1>
                <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', margin: 0 }}>سنرسل لك رمز تحقق على بريدك الإلكتروني</p>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label className="form-label">البريد الإلكتروني</label>
                <input className="form-input" type="email" placeholder="أدخل بريدك الإلكتروني" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
              </div>
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, marginBottom: 14 }} onClick={handleEmailSubmit} disabled={loading}>
                {loading ? '...جارِ الإرسال' : 'إرسال رمز التحقق'}
              </button>
              <button className="btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={() => navigate('/login')}>
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

              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 6 }} dir="ltr">
                {otp.map((v, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    value={v}
                    onChange={e => handleOTPInput(i, e.target.value)}
                    maxLength={1}
                    style={{
                      width: 48, height: 54, borderRadius: 12,
                      background: 'rgba(255,255,255,0.07)',
                      border: `1.5px solid ${otpError ? '#ef4444' : v ? '#7c3aed' : 'rgba(255,255,255,0.15)'}`,
                      color: '#fff', fontSize: 22, fontWeight: 700,
                      textAlign: 'center', outline: 'none', fontFamily: 'inherit',
                      transition: 'border-color 0.15s',
                    }}
                  />
                ))}
              </div>

              {otpError && <div style={{ textAlign: 'center', color: '#f87171', fontSize: 13, marginBottom: 12, marginTop: 4 }}>{otpError}</div>}

              <div style={{ textAlign: 'center', marginBottom: 20, marginTop: 12, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                {timerActive
                  ? <>انتهاء صلاحية الرمز خلال <span style={{ color: '#a855f7', fontWeight: 600 }}>{timer}s</span></>
                  : <button className="btn-ghost" style={{ fontSize: 13, color: '#a855f7', padding: '4px 8px' }} onClick={handleResend} disabled={loading}>إعادة إرسال الرمز</button>
                }
              </div>

              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, marginBottom: 10 }} onClick={handleVerifyOTP}>
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
                <input className="form-input" type="password" placeholder="••••••••" value={newPass} onChange={e => setNewPass(e.target.value)} disabled={loading} />
                {newPass.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                      {[1,2,3].map(i => (
                        <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: strength >= i ? strengthColors[strength] : 'rgba(255,255,255,0.1)', transition: 'background 0.2s' }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 11.5, color: strengthColors[strength] }}>{strengthLabels[strength]}</span>
                  </div>
                )}
              </div>
              <div style={{ marginBottom: 24 }}>
                <label className="form-label">تأكيد كلمة المرور</label>
                <input className="form-input" type="password" placeholder="••••••••" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} disabled={loading} />
                {confirmPass && newPass !== confirmPass && (
                  <div style={{ fontSize: 12, color: '#f87171', marginTop: 5 }}>كلمتا المرور غير متطابقتين</div>
                )}
              </div>
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15 }} onClick={handleResetPassword} disabled={loading}>
                {loading ? '...جارِ الحفظ' : 'حفظ كلمة المرور'}
              </button>
            </>
          )}

          {step === 'success' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🎉</div>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 10px' }}>تم بنجاح!</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: '0 0 28px' }}>تم تغيير كلمة مرورك بنجاح. يمكنك الآن تسجيل الدخول.</p>
              <button className="btn-primary" style={{ justifyContent: 'center', padding: '13px 36px', fontSize: 15 }} onClick={() => navigate('/login')}>
                العودة لتسجيل الدخول
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
