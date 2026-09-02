import { useEffect, useRef, useState } from 'react'
import { useNav } from '../context/NavContext'
import { useAuthApi, normalizeRole } from '../context/AuthApiContext'
import EdujarLogo from '../components/EdujarLogo'

type LocalStep = 'processing' | 'birth-date' | 'link-password' | 'guardian-email' | 'error'

// نفس منطق isMinor المستخدم في Register.tsx حرفياً — لا سبب لاستيراده من
// مكان مشترك حالياً بما أن كل صفحة مستقلة تماماً (لا Context مشترك لهذا
// الحساب المنطقي البسيط)، تفادياً لإعادة هيكلة غير ضرورية لأجل دالة سطرين.
function isMinor(dob: string): boolean {
  if (!dob) return false
  const birthDate = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const m = today.getMonth() - birthDate.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--
  return age < 18
}

export default function GoogleCallback() {
  const { navigate, login, setUserName, setUserEmail } = useNav()
  const { googleCallback, googleRegisterConfirm, googleLinkConfirm, googleGuardianEmail, getErrorMessage } = useAuthApi()
  const called = useRef(false)

  const [step, setStep] = useState<LocalStep>('processing')
  const [pendingToken, setPendingToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [birthDate, setBirthDate] = useState('')
  const [role, setRole] = useState<'Student' | 'Instructor'>('Student')
  const [linkPassword, setLinkPassword] = useState('')
  const [guardianEmail, setGuardianEmail] = useState('')

  const minor = isMinor(birthDate)

  // UX ONLY — الفرض الأمني الفعلي في oauth.service.js
  // (confirmGoogleRegistration → MINOR_CANNOT_BE_INSTRUCTOR). هنا الدور
  // وتاريخ الميلاد بنفس الشاشة، فالتصحيح التلقائي الفوري ممكن وأنسب من
  // مجرد تعطيل الخيار — يمنع إرسال طلب مرفوض للسيرفر أصلاً.
  useEffect(() => {
    if (minor && role === 'Instructor') setRole('Student')
  }, [minor, role])

  const applyLoggedInUser = (user: any) => {
    const role = normalizeRole(user?.role)
    setUserName(user?.full_name || 'مستخدم')
    setUserEmail(user?.email || '')
    login(role)
  }

  useEffect(() => {
    if (called.current) return
    called.current = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')

    if (!code || !state) {
      setError('رابط استرجاع Google غير صالح.')
      setStep('error')
      return
    }

    googleCallback(code, state)
      .then((result) => {
        if (result.kind === 'authenticated') {
          applyLoggedInUser(result.user)
        } else if (result.kind === 'requires_birth_date') {
          setPendingToken(result.token)
          setStep('birth-date')
        } else if (result.kind === 'requires_link_confirmation') {
          setPendingToken(result.token)
          setStep('link-password')
        } else if (result.kind === 'mfa_required') {
          // التحقق الثنائي منفصل بصفحة اللوجن — بنرجعه هناك برسالة توضيحية
          setError('هالحساب مفعّل عليه تحقق ثنائي. رجاءً سجّل دخولك من صفحة تسجيل الدخول العادية لإتمام التحقق.')
          setStep('error')
        }
      })
      .catch((err) => {
        setError(getErrorMessage(err))
        setStep('error')
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleBirthDateSubmit = async () => {
    if (!birthDate) {
      setError('اختر تاريخ الميلاد')
      return
    }
    setError('')
    setLoading(true)
    try {
      const result = await googleRegisterConfirm(pendingToken, birthDate, role)
      if (result.requiresGuardianEmail && result.guardianPendingToken) {
        setPendingToken(result.guardianPendingToken)
        setStep('guardian-email')
      } else if (result.user) {
        applyLoggedInUser(result.user)
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleLinkSubmit = async () => {
    if (!linkPassword) {
      setError('أدخل كلمة المرور')
      return
    }
    setError('')
    setLoading(true)
    try {
      const result = await googleLinkConfirm(pendingToken, linkPassword)
      if (result.user) applyLoggedInUser(result.user)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const handleGuardianSubmit = async () => {
    if (!guardianEmail.trim()) {
      setError('أدخل بريد ولي الأمر')
      return
    }
    setError('')
    setLoading(true)
    try {
      await googleGuardianEmail(pendingToken, guardianEmail.trim())
      setStep('processing')
      setError('')
      setTimeout(() => navigate('login'), 1500)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-shell">
      <div style={{ padding: '20px 28px', position: 'relative', zIndex: 1 }}>
        <button onClick={() => navigate('landing')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <EdujarLogo width={130} height={34} />
        </button>
      </div>
      <div className="auth-content">
        <div className="auth-card" style={{ maxWidth: 440, textAlign: 'center' }}>
          {step === 'processing' && (
            <>
              <div style={{ fontSize: 36, marginBottom: 16 }}>⏳</div>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>جارٍ إكمال تسجيل الدخول عبر Google...</p>
            </>
          )}

          {step === 'birth-date' && (
            <>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🎂</div>
              <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>خطوة أخيرة</h1>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', margin: '0 0 20px' }}>نحتاج تاريخ ميلادك لإتمام إنشاء حسابك</p>
              <div style={{ marginBottom: 16, textAlign: 'right' }}>
                <label className="form-label">نوع الحساب</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13.5, cursor: 'pointer' }}>
                    <input type="radio" checked={role === 'Student'} onChange={() => setRole('Student')} disabled={loading} />
                    طالب
                  </label>
                  <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13.5, cursor: 'pointer' }}>
                    <input type="radio" checked={role === 'Instructor'} onChange={() => setRole('Instructor')} disabled={loading || minor} />
                    مدرّس
                  </label>
                </div>
                {minor && (
                  <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', margin: '-4px 0 0', textAlign: 'right' }}>
                    خيار "مدرّس" غير متاح لمن هم دون 18 عاماً.
                  </p>
                )}
              </div>
              <div style={{ marginBottom: 16, textAlign: 'right' }}>
                <label className="form-label">تاريخ الميلاد</label>
                <input className="form-input" type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} disabled={loading} />
              </div>
              {error && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 14 }}>⚠️ {error}</div>}
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15 }} onClick={handleBirthDateSubmit} disabled={loading}>
                {loading ? '...جارٍ الحفظ' : 'إكمال التسجيل'}
              </button>
            </>
          )}

          {step === 'link-password' && (
            <>
              <div style={{ fontSize: 36, marginBottom: 12 }}>🔗</div>
              <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>ربط الحساب</h1>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', margin: '0 0 20px' }}>عندك حساب مسجل بهاد الإيميل مسبقاً. أدخل كلمة المرور لربطه بحساب Google</p>
              <div style={{ marginBottom: 16, textAlign: 'right' }}>
                <label className="form-label">كلمة المرور</label>
                <input className="form-input" type="password" placeholder="••••••••" value={linkPassword} onChange={e => setLinkPassword(e.target.value)} disabled={loading} />
              </div>
              {error && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 14 }}>⚠️ {error}</div>}
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15 }} onClick={handleLinkSubmit} disabled={loading}>
                {loading ? '...جارٍ الربط' : 'ربط الحساب'}
              </button>
            </>
          )}

          {step === 'guardian-email' && (
            <>
              <div style={{ fontSize: 36, marginBottom: 12 }}>👪</div>
              <h1 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>مطلوب موافقة ولي الأمر</h1>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', margin: '0 0 20px' }}>بما إنك دون 18 عاماً، لازم بريد ولي أمرك للموافقة على الحساب</p>
              <div style={{ marginBottom: 16, textAlign: 'right' }}>
                <label className="form-label">بريد ولي الأمر</label>
                <input className="form-input" type="email" placeholder="parent@example.com" value={guardianEmail} onChange={e => setGuardianEmail(e.target.value)} disabled={loading} />
              </div>
              {error && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 14 }}>⚠️ {error}</div>}
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15 }} onClick={handleGuardianSubmit} disabled={loading}>
                {loading ? '...جارٍ الإرسال' : 'إرسال الطلب'}
              </button>
            </>
          )}

          {step === 'error' && (
            <>
              <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
              <p style={{ color: '#f87171', fontSize: 14, marginBottom: 20 }}>{error}</p>
              <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: 15 }} onClick={() => navigate('login')}>
                العودة لتسجيل الدخول
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}