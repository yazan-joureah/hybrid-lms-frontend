import { useState } from 'react'
import { useNav, type Role } from '../context/NavContext'
import EdujarLogo from '../components/EdujarLogo'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default function Login() {
  const { navigate, login, setUserName, setUserEmail, setUserPhone, setUserDob, setUserBio, setUserGender } = useNav()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(true)
  const [loading, setLoading] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [error, setError] = useState('')

  const emailValid = EMAIL_RE.test(email)

  const handleLogin = () => {
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
    setTimeout(() => {
      setLoading(false)

      // Recognize a name and role saved during registration, if this email matches.
      let recognizedName = ''
      let recognizedRole: Role = 'student'
      try {
        const stored = localStorage.getItem('edujar_user')
        if (stored) {
          const parsed = JSON.parse(stored)
          if (parsed.email && parsed.email.toLowerCase() === email.trim().toLowerCase()) {
            recognizedName = parsed.name
            if (parsed.phone) setUserPhone(parsed.phone)
            if (parsed.dob) setUserDob(parsed.dob)
            if (parsed.bio) setUserBio(parsed.bio)
            if (parsed.gender) setUserGender(parsed.gender)
            if (parsed.role) recognizedRole = parsed.role
          }
        }
      } catch {}

      const normalizedEmail = email.trim().toLowerCase()
      setUserName(recognizedName || normalizedEmail.split('@')[0] || 'مستخدم')
      setUserEmail(normalizedEmail)
      login(recognizedRole)
    }, 800)
  }

  return (
    <div style={{
      minHeight: '100vh', direction: 'rtl',
      background: 'linear-gradient(135deg, #080320 0%, #1a0550 40%, #0d0340 100%)',
      display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background blobs */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', top: '15%', right: '10%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.22) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '10%', left: '8%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(168,85,247,0.16) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', top: '60%', right: '45%', width: 250, height: 250, borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%)' }} />
      </div>

      {/* Header */}
      <div style={{ padding: '20px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
        <button onClick={() => navigate('landing')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
          <EdujarLogo width={130} height={34} />
        </button>
        <button className="btn-ghost" onClick={() => navigate('landing')}>الرئيسية</button>
      </div>

      {/* Card */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px', position: 'relative', zIndex: 1 }}>
        <div style={{
          width: '100%', maxWidth: 460,
          background: 'rgba(16,6,52,0.85)', backdropFilter: 'blur(28px)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 24,
          padding: '40px 36px', boxShadow: '0 24px 80px rgba(0,0,0,0.55)',
        }}>
          {/* Icon */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{
              width: 60, height: 60, borderRadius: '50%',
              border: '2px dashed rgba(255,255,255,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: 26,
            }}>☀</div>
            <h1 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px' }}>
              مرحباً بعودتك إلى <span className="gradient-text">Edujar!</span>
            </h1>
            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', margin: 0 }}>
              سجّل دخولك للوصول إلى كورساتك
            </p>
          </div>

          {/* Form */}
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

          <button style={{
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
        </div>
      </div>

      <div style={{ padding: '16px 28px', textAlign: 'center', position: 'relative', zIndex: 1 }}>
        <p style={{ color: 'rgba(255,255,255,0.28)', fontSize: 12 }}>© 2026 Edujar. جميع الحقوق محفوظة. | سياسة الخصوصية | شروط الخدمة</p>
      </div>
    </div>
  )
}