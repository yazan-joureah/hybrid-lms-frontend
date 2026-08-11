import { useState } from 'react'
import { useNav, type Role } from '../context/NavContext'
import EdujarLogo from '../components/EdujarLogo'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export default function Register() {
  const { navigate, login, setUserName, setUserEmail, setUserPhone, setUserDob, setUserBio, setUserGender } = useNav()
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPass, setConfirmPass] = useState('')
  const [dob, setDob] = useState('')
  const [phone, setPhone] = useState('')
  const [bio, setBio] = useState('')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [role, setRole] = useState<Role>('student')
  const [loading, setLoading] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)

  const emailValid = EMAIL_RE.test(email)

  const strength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : password.match(/[A-Z]/) && password.match(/[0-9]/) ? 4 : 3

  const strengthLabels = ['', 'ضعيفة', 'مقبولة', 'جيدة', 'قوية جداً']
  const strengthColors = ['', '#ef4444', '#f59e0b', '#10b981', '#06b6d4']

  const handleRegister = () => {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      const normalizedEmail = email.trim().toLowerCase()
      setUserName(name.trim() || 'مستخدم جديد')
      setUserEmail(normalizedEmail)
      setUserPhone(phone.trim())
      setUserDob(dob)
      setUserBio(bio.trim())
      setUserGender(gender)
      try {
        localStorage.setItem('edujar_user', JSON.stringify({
          role,
          name: name.trim(),
          email: normalizedEmail,
          phone: phone.trim(),
          dob,
          bio: bio.trim(),
          gender,
        }))
      } catch {}
      login(role)
    }, 1000)
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
            {[1, 2].map(s => (
              <div key={s} style={{ flex: 1, height: 3, borderRadius: 3, background: step >= s ? 'linear-gradient(90deg, #7c3aed, #a855f7)' : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
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
                <select className="form-input" value={role} onChange={e => setRole(e.target.value as Role)}>
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
            <button className="btn-ghost" style={{ color: '#a855f7', fontWeight: 700, fontSize: 13.5, padding: '2px 4px' }} onClick={() => navigate('login')}>
              تسجيل الدخول
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}