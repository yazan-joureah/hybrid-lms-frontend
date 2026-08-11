import { useState, useEffect, useRef, type ChangeEvent } from 'react'
import { useNav } from '../../context/NavContext'

export default function Profile() {
  const { userName, setUserName, userEmail, setUserEmail, userPhone, setUserPhone, userDob, setUserDob, userBio, setUserBio, userGender, setUserGender } = useNav()
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'billing'>('profile')
  const [twoFA, setTwoFA] = useState(false)
  const [name, setName] = useState(userName || 'أحمد محمد الأحمد')
  const [email, setEmail] = useState(userEmail || '')
  const [phone, setPhone] = useState(userPhone || '')
  const [dob, setDob] = useState(userDob || '')
  const [bio, setBio] = useState(userBio || '')
  const [gender, setGender] = useState<'male' | 'female'>(userGender || 'male')
  const [avatar, setAvatar] = useState('')
  const [saved, setSaved] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    setName(userName || 'أحمد محمد الأحمد')
    setEmail(userEmail || '')
    setPhone(userPhone || '')
    setDob(userDob || '')
    setBio(userBio || '')
    setGender(userGender || 'male')
    try {
      const stored = localStorage.getItem('edujar_user')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.email) setEmail(parsed.email)
        if (parsed.name) setName(parsed.name)
        if (parsed.phone) setPhone(parsed.phone)
        if (parsed.dob) setDob(parsed.dob)
        if (parsed.bio) setBio(parsed.bio)
        if (parsed.gender) setGender(parsed.gender)
        if (parsed.avatar) setAvatar(parsed.avatar)
      }
    } catch {}
  }, [userName, userEmail, userPhone, userDob, userBio, userGender])

  const handleSave = () => {
    setUserName(name)
    setUserEmail(email)
    setUserPhone(phone)
    setUserDob(dob)
    setUserBio(bio)
    setUserGender(gender)
    try {
      localStorage.setItem('edujar_user', JSON.stringify({ name, email, phone, dob, bio, gender, avatar }))
    } catch {}
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatar(reader.result)
        try {
          const stored = localStorage.getItem('edujar_user')
          const parsed = stored ? JSON.parse(stored) : {}
          localStorage.setItem('edujar_user', JSON.stringify({ ...parsed, avatar: reader.result }))
        } catch {}
      }
    }
    reader.readAsDataURL(file)
  }

  const openFilePicker = () => {
    fileInputRef.current?.click()
  }

  const billingHistory = [
    { id: 1, course: 'React المتقدم', date: '2026-07-10', amount: '349 ر.س', status: 'مدفوع' },
    { id: 2, course: 'Python للتحليل المالي', date: '2026-06-20', amount: '299 ر.س', status: 'مدفوع' },
    { id: 3, course: 'Figma UI/UX', date: '2026-05-05', amount: '199 ر.س', status: 'مدفوع' },
  ]

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: 24 }}>
        <h2 className="section-title">الملف الشخصي والإعدادات</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '4px 0 0' }}>إدارة بياناتك وإعدادات الأمان</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 22 }}>
        {/* Left panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Avatar */}
          <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '24px', textAlign: 'center' }}>
            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
            <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', background: avatar ? 'transparent' : 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, fontWeight: 800, color: '#fff', margin: '0 auto 12px', border: '3px solid rgba(168,85,247,0.5)' }}>
              {avatar ? <img src={avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (name || 'م')[0]}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>{name || 'مستخدم'}</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.75)', marginBottom: 8 }}>{gender === 'female' ? 'طالبة' : 'طالب'}</div>
            <span className="badge badge-success" style={{ fontSize: 11.5 }}>✓ KYC موثّق</span>
            <button onClick={openFilePicker} style={{ display: 'block', margin: '14px auto 0', background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9999, padding: '7px 16px', color: 'rgba(255,255,255,0.7)', fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}>
              تغيير الصورة
            </button>
          </div>

          {/* Quick stats */}
          <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '18px' }}>
            {[['📚', '3 كورسات نشطة'], ['🏆', '2 شهادة'], ['⏱️', '45 ساعة تعلم'], ['📊', '87% حضور']].map(([i, l]) => (
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
            <div className={`tab-item${activeTab === 'billing' ? ' active' : ''}`} onClick={() => setActiveTab('billing')}>سجل الدفع</div>
          </div>

          {activeTab === 'profile' && (
            <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '28px' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 22px' }}>المعلومات الشخصية</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 18 }}>
                <div>
                  <label className="form-label">الاسم الكامل</label>
                  <input className="form-input" value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div>
                  <label className="form-label">البريد الإلكتروني</label>
                  <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} />
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
              <button
                className="btn-primary"
                style={{ padding: '11px 28px', fontSize: 14 }}
                onClick={handleSave}
              >
                {saved ? '✓ تم الحفظ' : 'حفظ التغييرات'}
              </button>
            </div>
          )}

          {activeTab === 'security' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Change password */}
              <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '24px' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 18px' }}>🔑 تغيير كلمة المرور</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 400 }}>
                  <div><label className="form-label">كلمة المرور الحالية</label><input className="form-input" type="password" placeholder="••••••••" /></div>
                  <div><label className="form-label">كلمة المرور الجديدة</label><input className="form-input" type="password" placeholder="••••••••" /></div>
                  <div><label className="form-label">تأكيد كلمة المرور</label><input className="form-input" type="password" placeholder="••••••••" /></div>
                  <button className="btn-primary" style={{ padding: '11px 24px', fontSize: 14, width: 'fit-content' }}>تحديث كلمة المرور</button>
                </div>
              </div>

              {/* 2FA */}
              <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 6px' }}>🔐 التحقق الثنائي (2FA)</h3>
                    <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.55)', margin: 0, maxWidth: 400 }}>
                      أضف طبقة حماية إضافية لحسابك. عند تفعيله ستحتاج لرمز تحقق عند كل تسجيل دخول.
                    </p>
                  </div>
                  <div className={`toggle${twoFA ? ' on' : ''}`} onClick={() => setTwoFA(!twoFA)} />
                </div>
                {twoFA && (
                  <div style={{ marginTop: 16, padding: '14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12 }}>
                    <div style={{ fontSize: 13.5, color: '#34d399', fontWeight: 600, marginBottom: 4 }}>✓ التحقق الثنائي مفعّل</div>
                    <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)' }}>سيتم إرسال رمز تحقق على هاتفك عند كل تسجيل دخول</div>
                  </div>
                )}
              </div>

              {/* Active sessions */}
              <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '24px' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>💻 الجلسات النشطة</h3>
                {[['Chrome / Windows', '192.168.1.1', 'الجلسة الحالية', true], ['Safari / iPhone', '10.0.0.1', 'منذ يومين', false]].map(([device, ip, time, current]) => (
                  <div key={device as string} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontSize: 20 }}>{(device as string).includes('Chrome') ? '💻' : '📱'}</span>
                      <div>
                        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{device as string}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{ip as string} • {time as string}</div>
                      </div>
                    </div>
                    {current ? <span className="badge badge-success">حالياً</span> : <button style={{ background: 'none', border: 'none', color: '#f87171', fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}>إنهاء</button>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>💳 سجل المدفوعات</h3>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>الكورس</th>
                    <th>التاريخ</th>
                    <th>المبلغ</th>
                    <th>الحالة</th>
                    <th>فاتورة</th>
                  </tr>
                </thead>
                <tbody>
                  {billingHistory.map(b => (
                    <tr key={b.id}>
                      <td style={{ fontWeight: 500 }}>{b.course}</td>
                      <td style={{ color: 'rgba(255,255,255,0.55)' }}>{b.date}</td>
                      <td style={{ fontWeight: 700, color: '#a855f7' }}>{b.amount}</td>
                      <td><span className="badge badge-success">{b.status}</span></td>
                      <td><button style={{ background: 'none', border: 'none', color: '#a855f7', fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}>تحميل ⬇</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
