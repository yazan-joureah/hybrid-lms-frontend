import { useNav } from '../../context/NavContext'

export default function InstructorDashboard() {
  const { navigate } = useNav()

  const metrics = [
    { icon: '👥', label: 'الطلاب النشطون', value: '348', sub: '+24 هذا الأسبوع', color: '#7c3aed' },
    { icon: '📚', label: 'الكورسات النشطة', value: '5', sub: 'كورس منشور', color: '#06b6d4' },
    { icon: '✅', label: 'معدل الحضور', value: '84%', sub: 'هذا الشهر', color: '#10b981' },
    { icon: '💰', label: 'الأرباح الشهرية', value: '4,820 ر.س', sub: '+12% عن الشهر الماضي', color: '#f59e0b' },
  ]

  const submissions = [
    { student: 'فاطمة الزهراء', course: 'React المتقدم', assignment: 'بناء مكوّن قائمة المهام', time: 'منذ 20 دقيقة', status: 'pending' },
    { student: 'علي حسن', course: 'Python', assignment: 'تحليل مجموعة بيانات مالية', time: 'منذ ساعة', status: 'pending' },
    { student: 'نورة السعيد', course: 'React المتقدم', assignment: 'Redux Store Setup', time: 'منذ 3 ساعات', status: 'pending' },
  ]

  const sessions = [
    { course: 'React المتقدم', lesson: 'الدرس 9: Testing', day: 'السبت', time: '6:00م', students: 42 },
    { course: 'Python للبيانات', lesson: 'الدرس 6: NumPy', day: 'الأربعاء', time: '4:00م', students: 28 },
  ]

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 className="section-title">مرحباً، خالد! 👋</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '4px 0 0' }}>لديك 3 تقييمات معلقة وحصة قادمة غداً</p>
        </div>
        <button className="btn-primary" style={{ padding: '10px 22px', fontSize: 14 }} onClick={() => navigate('course-builder')}>
          + إنشاء كورس جديد
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, marginBottom: 28 }}>
        {metrics.map(m => (
          <div key={m.label} className="metric-card">
            <div style={{ width: 42, height: 42, borderRadius: 12, background: `${m.color}22`, border: `1px solid ${m.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 14 }}>{m.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 4 }}>{m.value}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{m.label}</div>
            <div style={{ fontSize: 11.5, color: m.color, marginTop: 4, fontWeight: 500 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, marginBottom: 22 }}>
        {/* Recent submissions */}
        <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>التسليمات الأخيرة</h3>
            <button className="btn-ghost" style={{ fontSize: 12.5, color: '#a855f7', padding: '4px 8px' }} onClick={() => navigate('grading-manager')}>عرض الكل ←</button>
          </div>
          {submissions.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {s.student[0]}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{s.student}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.assignment} — {s.course}</div>
              </div>
              <div style={{ textAlign: 'left', flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{s.time}</div>
                <button className="btn-primary" style={{ padding: '4px 12px', fontSize: 11.5, marginTop: 4 }} onClick={() => navigate('grading-manager')}>تقييم</button>
              </div>
            </div>
          ))}
        </div>

        {/* Upcoming sessions */}
        <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '22px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>الحصص القادمة</h3>
            <button className="btn-ghost" style={{ fontSize: 12.5, color: '#a855f7', padding: '4px 8px' }} onClick={() => navigate('live-controller')}>إدارة ←</button>
          </div>
          {sessions.map((s, i) => (
            <div key={i} style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 14, padding: '14px', marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 3 }}>{s.course}</div>
                  <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)' }}>{s.lesson}</div>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#c4b5fd' }}>{s.day} {s.time}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>👥 {s.students} طالب</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn-primary" style={{ flex: 1, justifyContent: 'center', padding: '8px', fontSize: 12.5 }} onClick={() => navigate('live-controller')}>
                  🚀 بدء البث
                </button>
                <button className="btn-outline" style={{ padding: '8px 14px', fontSize: 12.5 }} onClick={() => navigate('attendance-manager')}>
                  ✅ رمز الحضور
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '22px' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>إجراءات سريعة</h3>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {[
            ['🏗️', 'كورس جديد', 'course-builder'],
            ['✅', 'رمز الحضور', 'attendance-manager'],
            ['📝', 'اختبار جديد', 'quiz-creator'],
            ['📡', 'بدء بث', 'live-controller'],
            ['📈', 'التقارير', 'instructor-analytics'],
          ].map(([icon, label, page]) => (
            <button
              key={label}
              onClick={() => navigate(page as any)}
              style={{
                flex: '1 1 140px', background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)',
                borderRadius: 14, padding: '16px 12px', cursor: 'pointer', fontFamily: 'inherit',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                transition: 'all 0.15s', color: '#fff',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.2)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.1)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
            >
              <span style={{ fontSize: 24 }}>{icon}</span>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
