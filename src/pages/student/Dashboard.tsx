import { useState, useEffect } from 'react'
import { useNav } from '../../context/NavContext'

const enrolledCourses = [
  { id: 1, title: 'React المتقدم وإدارة الحالة', instructor: 'محمد الخالدي', progress: 72, img: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=300&h=160&fit=crop&auto=format', category: 'تطوير', lastLesson: 'الدرس 12: Redux Toolkit' },
  { id: 2, title: 'Python للتحليل المالي', instructor: 'أحمد عبدالله', progress: 45, img: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=300&h=160&fit=crop&auto=format', category: 'بيانات', lastLesson: 'الدرس 7: Pandas DataFrames' },
  { id: 3, title: 'تصميم UI/UX بـ Figma', instructor: 'سارة الأحمد', progress: 90, img: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=300&h=160&fit=crop&auto=format', category: 'تصميم', lastLesson: 'الدرس 18: Prototyping' },
]

const schedule = [
  { day: 'السبت', time: '6:00م', course: 'React المتقدم', type: 'مباشر', color: '#7c3aed' },
  { day: 'الأحد', time: '4:00م', course: 'Python', type: 'مسجّل', color: '#06b6d4' },
  { day: 'الثلاثاء', time: '7:30م', course: 'Figma UX', type: 'مباشر', color: '#10b981' },
  { day: 'الأربعاء', time: '5:00م', course: 'React المتقدم', type: 'اختبار', color: '#f59e0b' },
  { day: 'الجمعة', time: '9:00ص', course: 'Python', type: 'مباشر', color: '#06b6d4' },
]

export default function StudentDashboard() {
  const { navigate, userName } = useNav()
  const [countdown, setCountdown] = useState({ h: 2, m: 45, s: 0 })

  useEffect(() => {
    const iv = setInterval(() => {
      setCountdown(prev => {
        let { h, m, s } = prev
        s--
        if (s < 0) { s = 59; m-- }
        if (m < 0) { m = 59; h-- }
        if (h < 0) return prev
        return { h, m, s }
      })
    }, 1000)
    return () => clearInterval(iv)
  }, [])

  const pad = (n: number) => String(n).padStart(2, '0')

  return (
    <div className="page-wrapper">
      {/* Welcome banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(124,58,237,0.3) 0%, rgba(168,85,247,0.15) 100%)',
          border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20,
          padding: '24px 28px', marginBottom: 28,
          position: 'relative', overflow: 'hidden',
        }}
        className="dash-welcome-banner"
      >
        <div style={{ position: 'absolute', top: -30, left: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(124,58,237,0.15)', filter: 'blur(40px)' }} />
        <div style={{ position: 'relative' }}>
          <h2 style={{ fontSize: 24, fontWeight: 800, margin: '0 0 6px' }}>مرحباً يا {(userName || 'صديقنا').split(' ')[0]}! 👋</h2>
          <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 14, margin: 0 }}>لديك 3 دروس هذا الأسبوع. استمر في التقدم!</p>
        </div>
        <div className="dash-welcome-actions">
          <button className="btn-primary" style={{ padding: '10px 22px', fontSize: 14 }} onClick={() => navigate('my-courses')}>
            متابعة التعلم
          </button>
          <button className="btn-outline" style={{ padding: '9px 22px', fontSize: 14 }} onClick={() => navigate('course-catalog')}>
            استعراض الكورسات
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid-4" style={{ marginBottom: 28 }}>
        {[
          { icon: '📈', label: 'التقدم الكلي', value: '68%', sub: '+5% هذا الأسبوع', color: '#7c3aed' },
          { icon: '✅', label: 'نسبة الحضور', value: '87%', sub: '26 من 30 حصة', color: '#10b981' },
          { icon: '📚', label: 'الكورسات النشطة', value: '3', sub: 'كورس مسجّل', color: '#06b6d4' },
          { icon: '🏆', label: 'الشهادات المكتسبة', value: '2', sub: 'شهادة مكتملة', color: '#f59e0b' },
        ].map(m => (
          <div key={m.label} className="metric-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: `${m.color}22`, border: `1px solid ${m.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{m.icon}</div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{m.value}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{m.label}</div>
            <div style={{ fontSize: 11.5, color: m.color, marginTop: 4, fontWeight: 500 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="dash-main-grid">
        {/* Enrolled courses */}
        <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>كورساتي</h3>
            <button className="btn-ghost" style={{ fontSize: 13, color: '#a855f7', padding: '4px 10px' }} onClick={() => navigate('my-courses')}>
              عرض الكل ←
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {enrolledCourses.map(c => (
              <div key={c.id} onClick={() => navigate('my-courses')} style={{ display: 'flex', gap: 14, cursor: 'pointer', padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.03)', transition: 'all 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.3)'; (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.06)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)' }}
              >
                <img src={c.img} alt={c.title} style={{ width: 72, height: 54, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{c.title}</div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#a855f7', flexShrink: 0, marginRight: 8 }}>{c.progress}%</span>
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 8 }}>{c.instructor} • {c.lastLesson}</div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${c.progress}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Upcoming live */}
          <div style={{ background: 'linear-gradient(135deg, rgba(124,58,237,0.25) 0%, rgba(6,182,212,0.15) 100%)', border: '1px solid rgba(124,58,237,0.35)', borderRadius: 18, padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>الحصة القادمة</span>
              <span className="live-badge"><span className="live-dot" />مباشر قريباً</span>
            </div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>React المتقدم — Hooks</div>
            <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)', marginBottom: 14 }}>مع محمد الخالدي</div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 16 }} dir="ltr">
              {[{ v: countdown.h, l: 'س' }, { v: countdown.m, l: 'د' }, { v: countdown.s, l: 'ث' }].map((item, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: 10, padding: '8px 12px', fontSize: 22, fontWeight: 800, color: '#fff', minWidth: 52, fontVariantNumeric: 'tabular-nums' }}>{pad(item.v)}</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{item.l}</div>
                </div>
              ))}
            </div>
            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '10px', fontSize: 14 }} onClick={() => navigate('live-class')}>
              انضم للحصة
            </button>
          </div>

          {/* Quick attendance widget */}
          <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '20px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px' }}>الحضور هذا الشهر</h3>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {Array.from({ length: 30 }, (_, i) => {
                const status = i < 26 ? (i % 5 === 4 ? 'absent' : 'present') : 'future'
                return (
                  <div key={i} style={{
                    width: 16, height: 16, borderRadius: 4,
                    background: status === 'present' ? '#10b981' : status === 'absent' ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.08)',
                  }} />
                )
              })}
            </div>
            <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
              {[['#10b981', 'حاضر'], ['rgba(239,68,68,0.7)', 'غائب'], ['rgba(255,255,255,0.15)', 'قادم']].map(([c, l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, color: 'rgba(255,255,255,0.5)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: c }} />{l}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Weekly schedule */}
      <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '22px' }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 18px' }}>الجدول الأسبوعي</h3>
        <div className="dash-weekly-schedule">
          {schedule.map((s, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 14, padding: '14px 12px', textAlign: 'center',
              borderTop: `3px solid ${s.color}`,
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{s.day}</div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{s.time}</div>
              <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.7)', marginBottom: 8 }}>{s.course}</div>
              <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 9999, fontSize: 10.5, fontWeight: 600, background: `${s.color}22`, color: s.color }}>
                {s.type}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}