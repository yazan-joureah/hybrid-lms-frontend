export default function InstructorAnalytics() {
  const courses = [
    { name: 'React المتقدم', students: 120, completion: 72, avg: 85, attendance: 88 },
    { name: 'Python للبيانات', students: 85, completion: 55, avg: 79, attendance: 82 },
    { name: 'Node.js APIs', students: 67, completion: 40, avg: 91, attendance: 76 },
  ]

  const weeklyAttendance = [65, 70, 80, 75, 88, 90, 84]
  const days = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت']
  const maxAtt = Math.max(...weeklyAttendance)

  const topStudents = [
    { name: 'فاطمة الزهراء', score: 96, course: 'React المتقدم' },
    { name: 'علي حسن', score: 93, course: 'Python' },
    { name: 'نورة السعيد', score: 91, course: 'React المتقدم' },
    { name: 'ريم الحارثي', score: 89, course: 'Node.js' },
  ]

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 className="section-title">تقارير الطلاب والأداء</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '4px 0 0' }}>تحليل شامل لأداء الطلاب في جميع الكورسات</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn-outline" style={{ padding: '9px 18px', fontSize: 13.5 }}>📊 تصدير PDF</button>
          <button className="btn-outline" style={{ padding: '9px 18px', fontSize: 13.5 }}>📈 تصدير Excel</button>
        </div>
      </div>

      {/* Summary metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 18, marginBottom: 28 }}>
        {[['👥', '272', 'إجمالي الطلاب', '#7c3aed'], ['📚', '3', 'كورسات نشطة', '#06b6d4'], ['📊', '85%', 'متوسط الدرجات', '#10b981'], ['✅', '82%', 'معدل الحضور', '#f59e0b']].map(([icon, val, label, color]) => (
          <div key={label} className="metric-card">
            <div style={{ width: 42, height: 42, borderRadius: 12, background: `${color}22`, border: `1px solid ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 14 }}>{icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800 }}>{val}</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22, marginBottom: 22 }}>
        {/* Attendance chart */}
        <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '22px' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px' }}>اتجاهات الحضور الأسبوعية</h3>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end', height: 140 }}>
            {weeklyAttendance.map((v, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', fontWeight: 600 }}>{v}%</span>
                <div style={{ width: '100%', height: `${(v / maxAtt) * 100}px`, background: 'linear-gradient(180deg, #a855f7, #7c3aed)', borderRadius: '6px 6px 0 0', transition: 'height 0.5s', minHeight: 4 }} />
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{days[i].slice(0, 2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top students */}
        <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '22px' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>🏆 أفضل الطلاب أداءً</h3>
          {topStudents.map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: i === 0 ? 'linear-gradient(135deg, #f59e0b, #d97706)' : i === 1 ? 'linear-gradient(135deg, #94a3b8, #64748b)' : i === 2 ? 'linear-gradient(135deg, #b45309, #92400e)' : 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                {i + 1}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{s.name}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{s.course}</div>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#34d399' }}>{s.score}%</div>
            </div>
          ))}
        </div>
      </div>

      {/* Course performance table */}
      <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>أداء الكورسات</h3>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>الكورس</th>
              <th>الطلاب</th>
              <th>معدل الإكمال</th>
              <th>متوسط الدرجات</th>
              <th>معدل الحضور</th>
              <th>التقرير</th>
            </tr>
          </thead>
          <tbody>
            {courses.map(c => (
              <tr key={c.name}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td style={{ color: 'rgba(255,255,255,0.7)' }}>{c.students}</td>
                <td>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div className="progress-bar" style={{ width: 80 }}>
                      <div className="progress-fill" style={{ width: `${c.completion}%` }} />
                    </div>
                    <span style={{ fontSize: 12.5 }}>{c.completion}%</span>
                  </div>
                </td>
                <td style={{ fontWeight: 700, color: c.avg >= 85 ? '#34d399' : c.avg >= 70 ? '#fbbf24' : '#f87171' }}>{c.avg}%</td>
                <td style={{ fontWeight: 700, color: c.attendance >= 85 ? '#34d399' : '#fbbf24' }}>{c.attendance}%</td>
                <td>
                  <button style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 8, padding: '5px 12px', color: '#c4b5fd', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                    عرض التفاصيل
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
