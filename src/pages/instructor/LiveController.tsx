import { useState } from 'react'
import { useNav } from '../../context/NavContext'

export default function LiveController() {
  const { navigate } = useNav()
  const [isLive, setIsLive] = useState(false)
  const [quizOpen, setQuizOpen] = useState(false)
  const [handRaised] = useState(['فاطمة الزهراء', 'علي حسن', 'ريم الحارثي'])
  const [attendees] = useState(34)

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: 24 }}>
        <h2 className="section-title">وحدة التحكم بالبث المباشر</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '4px 0 0' }}>إدارة الحصة المباشرة والتفاعل مع الطلاب</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 22 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Stream control */}
          <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: `1px solid ${isLive ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`, borderRadius: 18, padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 4px' }}>React المتقدم — الدرس 9</h3>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>خالد المدرّس • 👥 {attendees} طالب</div>
              </div>
              {isLive && <span className="live-badge"><span className="live-dot" />مباشر الآن</span>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
              {[['👥', 'الحاضرون', String(attendees)], ['✋', 'رافعو الأيدي', String(handRaised.length)], ['💬', 'رسائل الدردشة', '47'], ['⏱', 'مدة البث', isLive ? '00:24:15' : '—']].map(([icon, label, val]) => (
                <div key={label} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '14px', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{icon}</div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', marginBottom: 2 }}>{val}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button
                style={{ flex: 1, padding: '13px', borderRadius: 9999, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, color: '#fff', background: isLive ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #10b981, #059669)', transition: 'all 0.15s' }}
                onClick={() => setIsLive(!isLive)}
              >
                {isLive ? '⏹ إنهاء البث' : '🔴 بدء البث المباشر'}
              </button>
              <button className="btn-outline" style={{ padding: '13px 20px', fontSize: 14 }}>🖥️ مشاركة الشاشة</button>
              <button
                className="btn-primary"
                style={{ padding: '13px 20px', fontSize: 14 }}
                onClick={() => setQuizOpen(true)}
              >📝 اختبار سريع</button>
            </div>
          </div>

          {/* Hand raise queue */}
          <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '22px' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>✋ قائمة رافعي الأيدي</h3>
            {handRaised.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '20px', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>لا يوجد طلاب رافعون أيديهم</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {handRaised.map((name, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(255,255,255,0.04)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ background: 'rgba(245,158,11,0.2)', padding: '2px 8px', borderRadius: 9999, fontSize: 12, color: '#fbbf24', fontWeight: 600 }}>#{i + 1}</span>
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{name}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button style={{ background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '5px 12px', color: '#34d399', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>سماح بالكلام</button>
                      <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', fontSize: 16 }}>✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Attendance shortcut */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '22px', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🔢</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 8px' }}>رمز الحضور</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', margin: '0 0 16px' }}>ولّد رمز حضور للطلاب</p>
            <button className="btn-primary" style={{ justifyContent: 'center', padding: '11px 24px', fontSize: 14 }} onClick={() => navigate('attendance-manager')}>
              إنشاء رمز حضور
            </button>
          </div>

          <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '22px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px' }}>أدوات الحصة</h3>
            {[['🖋️', 'السبورة التفاعلية'], ['📊', 'استطلاع رأي'], ['🔗', 'مشاركة رابط'], ['⏸', 'استراحة مؤقتة']].map(([icon, label]) => (
              <button key={label} style={{ display: 'flex', gap: 10, alignItems: 'center', width: '100%', padding: '10px 12px', borderRadius: 10, border: 'none', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.7)', fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit', marginBottom: 6, transition: 'all 0.15s', textAlign: 'right' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.12)'; (e.currentTarget as HTMLElement).style.color = '#fff' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.7)' }}
              >
                <span style={{ fontSize: 18 }}>{icon}</span>
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick quiz launcher */}
      {quizOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'rgba(12,4,45,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 22, padding: '32px', maxWidth: 480, width: '100%' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 20px', textAlign: 'center' }}>🚀 إطلاق اختبار مباشر</h3>
            <div style={{ marginBottom: 14 }}>
              <label className="form-label">السؤال</label>
              <input className="form-input" defaultValue="ما الفرق بين useMemo وuseCallback؟" />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="form-label">الخيارات</label>
              {['useMemo يحفظ قيمة، useCallback دالة', 'كلاهما متطابقان', 'useMemo أفضل دائماً', 'لا فرق بينهما'].map((opt, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <input className="form-input" defaultValue={opt} style={{ flex: 1 }} />
                  <input type="radio" name="correct" defaultChecked={i === 0} style={{ flexShrink: 0 }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '11px', fontSize: 14 }} onClick={() => setQuizOpen(false)}>إلغاء</button>
              <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '11px', fontSize: 14 }} onClick={() => setQuizOpen(false)}>🚀 إطلاق الاختبار</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
