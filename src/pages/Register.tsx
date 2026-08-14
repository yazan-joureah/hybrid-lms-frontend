import { useState } from 'react'
import { useNav, type Role } from '../context/NavContext'
import { useAuthApi, mapRoleToBackend, getCodeErrorMessage } from '../context/AuthApiContext'
import EdujarLogo from '../components/EdujarLogo'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

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
  const { navigate } = useNav()
  const { register: apiRegister, verifyEmail: apiVerifyEmail, resendVerification, getErrorMessage } = useAuthApi()

  const [step, setStep] = useState(1) // 1: بيانات الحساب, 2: تفاصيل إضافية, 3: تحقق الإيميل
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [dob, setDob] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [role, setRole] = useState<Role>('student')
  const [guardianEmail, setGuardianEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [error, setError] = useState('')
  const [infoMsg, setInfoMsg] = useState('')

  // خطوة تحقق الإيميل
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', ''])
  const [otpError, setOtpError] = useState('')
  const [cooldown, setCooldown] = useState(0)

  const emailValid = EMAIL_RE.test(email)
  const minor = isMinor(dob)

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : password.match(/[A-Z]/) && password.match(/[0-9]/) ? 4 : 3

  const strengthLabels = ['', 'ضعيفة', 'مقبولة', 'جيدة', 'قوية جداً']
  const strengthColors = ['', '#ef4444', '#f59e0b', '#10b981', '#06b6d4']

  // ملاحظة: phone / bio / gender حاليًا بيتخزنوا محليًا فقط لعرضهم بالواجهة —
  // الباك (حسب endpoint التسجيل الحالي) بياخد فقط: full_name, email, password,
  // birth_date, role, guardian_email. لما يصير عندك endpoint لتحديث البروفايل،
  // ابعتلي إياه ونضيف استدعاء بعد التحقق من الإيميل لحفظ هالحقول فعليًا بالباك.
  const handleRegister = async () => {
    if (password !== confirmPass) {
      setError('كلمتا المرور غير متطابقتين')
      return
    }
    if (minor && !guardianEmail.trim()) {
      setError('بما أنك دون 18 عاماً، لازم تدخل بريد ولي الأمر')
      return
    }

    setError('')
    setLoading(true)
    try {
      const result = await apiRegister({
        full_name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        birth_date: dob,
        // الباك بيتوقع 'Student' / 'Instructor' بأحرف كبيرة (نفس منطق كود صاحبك)
        role: mapRoleToBackend(role),
        guardian_email: minor ? guardianEmail.trim() : undefined,
        privacy_consent_version: '1.0',
      })

      if (result?.requires_guardian_approval) {
        setInfoMsg('تم إنشاء الحساب! بانتظار موافقة ولي الأمر عبر البريد الإلكتروني.')
        setTimeout(() => navigate('login'), 2500)
      } else {
        setStep(3)
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleOtpDigit = (idx: number, val: string) => {
    if (val.length > 1) return
    const next = [...otpDigits]
    next[idx] = val.replace(/[^0-9]/g, '')
    setOtpDigits(next)
    if (val && idx < 5) {
      document.getElementById(`register-otp-${idx + 1}`)?.focus()
    }
  }

  const handleVerifyEmail = async () => {
    const code = otpDigits.join('')
    if (code.length !== 6) {
      setOtpError('أدخل الرمز المكوّن من 6 أرقام كاملاً')
      return
    }
    setOtpError('')
    setLoading(true)
    try {
      const result = await apiVerifyEmail(email.trim().toLowerCase(), code)
      if (result?.nextStep === 'guardian_pending') {
        setInfoMsg('تم التحقق! بانتظار موافقة ولي الأمر الآن.')
      } else {
        setInfoMsg('تم تفعيل حسابك بنجاح! يمكنك تسجيل الدخول الآن.')
      }
      setTimeout(() => navigate('login'), 2000)
    } catch (err) {
      // نفس أكواد الخطأ المحددة يلي بكود صاحبك بالضبط (INVALID_CODE, CODE_EXPIRED, TOO_MANY_ATTEMPTS)
      setOtpError(getCodeErrorMessage(err, getErrorMessage(err)))
    } finally {
      setLoading(false)
    }
  }

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
      setOtpError(getErrorMessage(err))
    } finally {
      setLoading(false)
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
        <button onClick={() => navigate('landing')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <EdujarLogo width={130} height={34} />
        </button>
        <button className="btn-ghost" onClick={() => navigate('landing')}>الرئيسية</button>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px', position: 'relative', zIndex: 1 }}>
        <div style={{
          width: '100%', maxWidth: 500,
          background: 'rgba(16,6,52,0.85)', backdropFilter: 'blur(28px)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24,
          padding: '40px 36px', boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
        }}>
          {/* Steps */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28 }}>
            {[1, 2, 3].map(s => (
              <div key={s} style={{ flex: 1, height: 3, borderRadius: 3, background: step >= s ? 'linear-gradient(90deg, #7c3aed, #a855f7)' : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
            ))}
          </div>

          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <h1 style={{ fontSize: 23, fontWeight: 800, margin: '0 0 6px' }}>
              {step === 1 ? 'إنشاء حسابك' : step === 2 ? 'معلومات إضافية' : 'تحقق من بريدك'}
            </h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              {step === 1 ? 'الخطوة 1 من 3 — بيانات الحساب' : step === 2 ? 'الخطوة 2 من 3 — إتمام التسجيل' : 'الخطوة 3 من 3 — تفعيل الحساب'}
            </p>
          </div>

          {infoMsg && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#34d399', marginBottom: 16 }}>
              ✅ {infoMsg}
            </div>
          )}

          {step === 1 && (
            <>
              <div style={{ marginBottom: 16 }}>
                <label className="form-label">نوع الحساب</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    style={{
                      flex: 1, padding: '9px 12px', borderRadius: 10,
                      border: role === 'student' ? '1.5px solid #a855f7' : '1.5px solid rgba(255,255,255,0.12)',
                      background: role === 'student'
                        ? 'linear-gradient(135deg, rgba(124,58,237,0.28), rgba(168,85,247,0.16))'
                        : 'rgba(255,255,255,0.04)',
                      cursor: 'pointer', color: '#fff', fontFamily: 'inherit',
                      fontSize: 13.5, fontWeight: 700,
                      transition: 'all 0.15s',
                    }}
                  >طالب</button>
                  <button
                    type="button"
                    onClick={() => setRole('instructor')}
                    style={{
                      flex: 1, padding: '9px 12px', borderRadius: 10,
                      border: role === 'instructor' ? '1.5px solid #a855f7' : '1.5px solid rgba(255,255,255,0.12)',
                      background: role === 'instructor'
                        ? 'linear-gradient(135deg, rgba(124,58,237,0.28), rgba(168,85,247,0.16))'
                        : 'rgba(255,255,255,0.04)',
                      cursor: 'pointer', color: '#fff', fontFamily: 'inherit',
                      fontSize: 13.5, fontWeight: 700,
                      transition: 'all 0.15s',
                    }}
                  >أستاذ</button>
                </div>
              </div>

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
                  <label className="form-label">بريد ولي الأمر الإلكتروني</label>
                  <input className="form-input" type="email" placeholder="parent@example.com" value={guardianEmail} onChange={e => setGuardianEmail(e.target.value)} />
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 5 }}>مطلوب موافقة ولي الأمر لأن عمرك أقل من 18 سنة</div>
                </div>
              )}

              <div style={{ marginBottom: 20 }}>
                <label className="form-label">نبذة شخصية</label>
                <textarea className="form-input" rows={3} placeholder="أنا طالب أحب تعلم تطوير الويب" value={bio} onChange={e => setBio(e.target.value)} style={{ resize: 'none' }} />
              </div>

              {error && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#f87171', marginBottom: 16 }}>
                  ⚠️ {error}
                </div>
              )}

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

          {step === 3 && (
            <>
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📧</div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                  أرسلنا رمزاً من 6 أرقام إلى<br />
                  <span style={{ color: '#a855f7', fontWeight: 600 }}>{email}</span>
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 6 }} dir="ltr">
                {otpDigits.map((v, i) => (
                  <input
                    key={i}
                    id={`register-otp-${i}`}
                    value={v}
                    onChange={e => handleOtpDigit(i, e.target.value)}
                    maxLength={1}
                    disabled={loading}
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

              <button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15, marginTop: 16, marginBottom: 10 }}
                onClick={handleVerifyEmail}
                disabled={loading}
              >{loading ? '...جارٍ التحقق' : 'تفعيل الحساب'}</button>

              <div style={{ textAlign: 'center', fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                <button className="btn-ghost" style={{ fontSize: 13, color: '#a855f7', padding: '4px 8px' }} onClick={handleResend} disabled={cooldown > 0 || loading}>
                  {cooldown > 0 ? `إعادة الإرسال خلال ${cooldown}s` : 'لم يصلك الرمز؟ إعادة الإرسال'}
                </button>
              </div>
            </>
          )}

          {step !== 3 && (
            <div style={{ textAlign: 'center', marginTop: 18, fontSize: 13.5, color: 'rgba(255,255,255,0.5)' }}>
              لديك حساب بالفعل؟{' '}
              <button className="btn-ghost" style={{ color: '#a855f7', fontWeight: 700, fontSize: 13.5, padding: '2px 4px' }} onClick={() => navigate('login')}>
                تسجيل الدخول
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
