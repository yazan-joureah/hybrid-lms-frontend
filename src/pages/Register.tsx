import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import { getErrorMessage } from '../utils/errorMessages'
import EdujarLogo from '../components/EdujarLogo'
import type { RegisterPayload } from '../types'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

type Step = 1 | 2 | 3 | 'pending-guardian'

function isMinor(dob: string): boolean {
  if (!dob) return false
  const birthDate = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age < 18
}

export default function Register() {
  const { register, verifyEmail, resendVerification } = useAuth()
  const { showMsg } = useToast()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [dob, setDob] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [role, setRole] = useState<'student' | 'instructor'>('student')
  const [guardianEmail, setGuardianEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)

  // Email verification (step 3)
  const [verifyCode, setVerifyCode] = useState(['', '', '', '', '', ''])
  const [verifyError, setVerifyError] = useState('')
  const [cooldown, setCooldown] = useState(0)

  const emailValid = EMAIL_RE.test(email)
  const minor = isMinor(dob)

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : password.match(/[A-Z]/) && password.match(/[0-9]/) ? 4 : 3
  const strengthLabels = ['', 'ضعيفة', 'مقبولة', 'جيدة', 'قوية جداً']
  const strengthColors = ['', '#ef4444', '#f59e0b', '#10b981', '#06b6d4']

  const handleRegister = async () => {
    if (password !== confirmPass) {
      showMsg('كلمتا المرور غير متطابقتين', 'error')
      return
    }
    if (minor && !guardianEmail.trim()) {
      showMsg('يرجى إدخال البريد الإلكتروني لولي الأمر', 'error')
      return
    }
    setLoading(true)
    const payload: Partial<RegisterPayload> = {
      full_name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
      birth_date: dob,
      role: role === 'instructor' ? 'Instructor' : 'Student',
      phone: phone.trim(),
      bio: bio.trim(),
      gender,
      privacy_consent_version: '1.0',
    }
    if (minor && guardianEmail.trim()) payload.guardian_email = guardianEmail.trim()

    try {
      const result = await register(payload)
      setLoading(false)
      if (result?.requires_guardian_approval) {
        showMsg('تم إنشاء الحساب! بانتظار موافقة ولي الأمر.', 'info')
        setStep('pending-guardian')
      } else {
        showMsg('تم إنشاء الحساب! تحقق من بريدك الإلكتروني لرمز التفعيل.', 'success')
        setStep(3)
      }
    } catch (err) {
      setLoading(false)
      showMsg(getErrorMessage(err), 'error')
    }
  }

  const handleVerifyInput = (idx: number, val: string) => {
    if (val.length > 1) return
    const next = [...verifyCode]
    next[idx] = val
    setVerifyCode(next)
    if (val && idx < 5) document.getElementById(`verify-${idx + 1}`)?.focus()
  }

  const handleVerifyEmail = async () => {
    const code = verifyCode.join('')
    if (code.length !== 6) {
      setVerifyError('يرجى إدخال الرمز المكوّن من 6 أرقام كاملاً')
      return
    }
    setLoading(true)
    setVerifyError('')
    try {
      const result = await verifyEmail(email.trim().toLowerCase(), code)
      setLoading(false)
      if (result?.nextStep === 'guardian_pending') {
        showMsg('تم توثيق بريدك! بانتظار موافقة ولي الأمر.', 'info')
      } else {
        showMsg('تم توثيق بريدك بنجاح! يمكنك تسجيل الدخول الآن.', 'success')
      }
      navigate('/login')
    } catch (err) {
      setLoading(false)
      const msg = getErrorMessage(err) || 'رمز غير صحيح. حاول مرة أخرى.'
      setVerifyError(msg)
      showMsg(msg, 'error')
    }
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    try {
      await resendVerification(email.trim().toLowerCase())
      showMsg('تم إرسال رمز جديد إلى بريدك الإلكتروني.', 'success')
      setCooldown(60)
      const iv = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) { clearInterval(iv); return 0 }
          return prev - 1
        })
      }, 1000)
    } catch (err) {
      showMsg(getErrorMessage(err), 'error')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', direction: 'rtl',
      background: 'linear-gradient(135deg, #080320 0%, #1a0550 40%, #0d0340 100%)',
      display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '10%', left: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.14) 0%, transparent 70%)' }} />
      </div>

      <div style={{ padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <EdujarLogo width={130} height={34} />
        </button>
        <button className="btn-ghost" onClick={() => navigate('/')}>الرئيسية</button>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px', position: 'relative', zIndex: 1 }}>
        <div style={{
          width: '100%', maxWidth: 500,
          background: 'rgba(16,6,52,0.85)', backdropFilter: 'blur(28px)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24,
          padding: '40px 36px', boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
        }}>
          {step === 'pending-guardian' ? (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>⏳</div>
              <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 10px' }}>بانتظار موافقة ولي الأمر</h1>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: '0 0 28px' }}>
                أرسلنا رابط الموافقة إلى بريد ولي الأمر. سيصبح حسابك نشطاً بعد الموافقة.
              </p>
              <button className="btn-primary" style={{ justifyContent: 'center', padding: '13px 36px', fontSize: 15 }} onClick={() => navigate('/login')}>
                العودة لتسجيل الدخول
              </button>
            </div>
          ) : step === 3 ? (
            <>
              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📧</div>
                <h1 style={{ fontSize: 22, fontWeight: 800, margin: '0 0 8px' }}>تحقق من بريدك الإلكتروني</h1>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                  أرسلنا رمزاً من 6 أرقام إلى<br />
                  <span style={{ color: '#a855f7', fontWeight: 600 }}>{email}</span>
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 6 }} dir="ltr">
                {verifyCode.map((v, i) => (
                  <input
                    key={i}
                    id={`verify-${i}`}
                    value={v}
                    onChange={(e) => handleVerifyInput(i, e.target.value)}
                    maxLength={1}
                    style={{
                      width: 48, height: 54, borderRadius: 12,
                      background: 'rgba(255,255,255,0.07)',
                      border: `1.5px solid ${verifyError ? '#ef4444' : v ? '#7c3aed' : 'rgba(255,255,255,0.15)'}`,
                      color: '#fff', fontSize: 22, fontWeight: 700,
                      textAlign: 'center', outline: 'none', fontFamily: 'inherit',
                      transition: 'border-color 0.15s',
                    }}
                  />
                ))}
              </div>

              {verifyError && <div style={{ textAlign: 'center', color: '#f87171', fontSize: 13, marginTop: 10 }}>{verifyError}</div>}

              <div style={{ textAlign: 'center', marginTop: 16, marginBottom: 20 }}>
                <button className="btn-ghost" style={{ fontSize: 13, color: '#a855f7', padding: '4px 8px' }} onClick={handleResend} disabled={cooldown > 0}>
                  {cooldown > 0 ? `إعادة الإرسال خلال ${cooldown}ث` : 'لم يصلك الرمز؟ إعادة الإرسال'}
                </button>
              </div>

              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15 }} onClick={handleVerifyEmail} disabled={loading}>
                {loading ? '...جارٍ التحقق' : 'تفعيل الحساب'}
              </button>
            </>
          ) : (
            <>
              {/* Steps */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
                {[1, 2].map(s => (
                  <div key={s} style={{ flex: 1, height: 3, borderRadius: 3, background: (step as number) >= s ? 'linear-gradient(90deg, #7c3aed, #a855f7)' : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
                ))}
              </div>

              <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <h1 style={{ fontSize: 23, fontWeight: 800, margin: '0 0 6px' }}>
                  {step === 1 ? 'إنشاء حسابك' : 'معلومات إضافية'}
                </h1>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                  {step === 1 ? 'الخطوة 1 من 2 — بيانات الحساب' : 'الخطوة 2 من 2 — إتمام التسجيل'}
                </p>
              </div>

              {step === 1 && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label">الاسم الكامل</label>
                    <input className="form-input" placeholder="أحمد محمد الأحمد" value={name} onChange={e => setName(e.target.value)} />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label">البريد الإلكتروني</label>
                    <input
                      className="form-input"
                      type="email"
                      placeholder="ahmed@example.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      onBlur={() => setEmailTouched(true)}
                      style={{ borderColor: emailTouched && email && !emailValid ? '#ef4444' : undefined }}
                    />
                    {emailTouched && email && !emailValid && (
                      <div style={{ fontSize: 12, color: '#f87171', marginTop: 5 }}>يرجى إدخال بريد إلكتروني صحيح (مثال: name@example.com)</div>
                    )}
                  </div>

                  <button
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, marginBottom: 14, marginTop: 4, opacity: (name.trim() && emailValid) ? 1 : 0.5 }}
                    onClick={() => { setEmailTouched(true); if (name.trim() && emailValid) setStep(2) }}
                  >التالي ←</button>
                </>
              )}

              {step === 2 && (
                <>
                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label">كلمة المرور</label>
                    <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                    {password.length > 0 && (
                      <div style={{ marginTop: 8 }}>
                        <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                          {[1,2,3,4].map(i => (
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
                    {confirmPass && password !== confirmPass && (
                      <div style={{ fontSize: 12, color: '#f87171', marginTop: 5 }}>كلمتا المرور غير متطابقتين</div>
                    )}
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label">رقم الهاتف</label>
                    <input className="form-input" type="tel" placeholder="+966 50 123 4567" value={phone} onChange={e => setPhone(e.target.value)} />
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label">نوع الحساب</label>
                    <select className="form-input" value={role} onChange={e => setRole(e.target.value as 'student' | 'instructor')}>
                      <option value="student">طالب</option>
                      <option value="instructor">مدرس</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label">الجنس</label>
                    <select
                      className="form-input"
                      value={gender}
                      onChange={e => setGender(e.target.value as 'male' | 'female')}
                    >
                      <option value="male">ذكر</option>
                      <option value="female">أنثى</option>
                    </select>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label className="form-label">تاريخ الميلاد</label>
                    <input className="form-input" type="date" value={dob} onChange={e => setDob(e.target.value)} />
                  </div>

                  {minor && (
                    <div style={{ marginBottom: 16 }}>
                      <label className="form-label">البريد الإلكتروني لولي الأمر (مطلوب لمن هم دون 18 عاماً)</label>
                      <input className="form-input" type="email" placeholder="parent@example.com" value={guardianEmail} onChange={e => setGuardianEmail(e.target.value)} />
                    </div>
                  )}

                  <div style={{ marginBottom: 20 }}>
                    <label className="form-label">نبذة شخصية</label>
                    <textarea className="form-input" rows={3} placeholder="أنا طالب أحب تعلم تطوير الويب" value={bio} onChange={e => setBio(e.target.value)} style={{ resize: 'none' }} />
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginBottom: 4 }}>
                    <button className="btn-outline" style={{ flex: '0 0 auto', padding: '12px 20px', fontSize: 14 }} onClick={() => setStep(1)}>← رجوع</button>
                    <button
                      className="btn-primary"
                      style={{ flex: 1, justifyContent: 'center', padding: '13px', fontSize: 15 }}
                      onClick={handleRegister}
                      disabled={loading}
                    >{loading ? '...جارٍ إنشاء الحساب' : 'إنشاء الحساب'}</button>
                  </div>
                </>
              )}

              <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13.5, color: 'rgba(255,255,255,0.5)' }}>
                لديك حساب بالفعل؟{' '}
                <button className="btn-ghost" style={{ color: '#a855f7', fontWeight: 700, fontSize: 13.5, padding: '2px 4px' }} onClick={() => navigate('/login')}>
                  تسجيل الدخول
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
