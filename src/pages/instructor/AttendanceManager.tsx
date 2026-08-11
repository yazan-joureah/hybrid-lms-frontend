import { useState, useEffect } from 'react'

const students = [
  { id: 1, name: 'فاطمة الزهراء', time: '6:02م', duration: '89 دقيقة', status: 'حاضر', matched: true },
  { id: 2, name: 'علي حسن', time: '6:05م', duration: '84 دقيقة', status: 'حاضر', matched: true },
  { id: 3, name: 'نورة السعيد', time: '6:15م', duration: '74 دقيقة', status: 'متأخر', matched: true },
  { id: 4, name: 'محمد العلي', time: '—', duration: '—', status: 'غائب', matched: false },
  { id: 5, name: 'ريم الحارثي', time: '6:03م', duration: '91 دقيقة', status: 'حاضر', matched: true },
  { id: 6, name: 'يوسف الأحمد', time: '—', duration: '—', status: 'غائب', matched: false },
]

export default function AttendanceManager() {
  const [code, setCode] = useState('7429')
  const [codeTimer, setCodeTimer] = useState(300)
  const [codeActive, setCodeActive] = useState(true)
  const [selectedDuration, setSelectedDuration] = useState(5)
  const [overrideModal, setOverrideModal] = useState<typeof students[0] | null>(null)
  const [overrideReason, setOverrideReason] = useState('')
  const [data, setData] = useState(students)
  const [dragOver, setDragOver] = useState(false)

  const pad = (n: number) => String(n).padStart(2, '0')

  useEffect(() => {
    if (!codeActive || codeTimer <= 0) return
    const iv = setInterval(() => setCodeTimer(p => { if (p <= 1) { setCodeActive(false); return 0 } return p - 1 }), 1000)
    return () => clearInterval(iv)
  }, [codeActive, codeTimer])

  const generateCode = () => {
    setCode(String(Math.floor(1000 + Math.random() * 9000)))
    setCodeTimer(selectedDuration * 60)
    setCodeActive(true)
  }

  const handleOverride = (student: typeof students[0]) => {
    setData(prev => prev.map(s => s.id === student.id ? { ...s, status: 'حاضر', matched: true } : s))
    setOverrideModal(null)
    setOverrideReason('')
  }

  const statusColor = { 'حاضر': '#10b981', 'متأخر': '#f59e0b', 'غائب': '#ef4444' } as Record<string, string>

  return (
    <div className="page-wrapper">
      <div style={{ marginBottom: 24 }}>
        <h2 className="section-title">إدارة الحضور</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '4px 0 0' }}>إنشاء رموز الحضور ومراجعة السجلات</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', gap: 22 }}>
        {/* Code generator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '24px' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 20px' }}>🔢 مولّد رمز الحضور</h3>

            {/* Big code display */}
            <div style={{
              textAlign: 'center', padding: '28px 20px',
              background: codeActive ? 'rgba(124,58,237,0.15)' : 'rgba(239,68,68,0.1)',
              border: `2px solid ${codeActive ? 'rgba(124,58,237,0.4)' : 'rgba(239,68,68,0.3)'}`,
              borderRadius: 16, marginBottom: 16,
            }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {codeActive ? 'الرمز الحالي' : 'انتهت الصلاحية'}
              </div>
              <div style={{ fontSize: 52, fontWeight: 900, letterSpacing: 14, color: codeActive ? '#fff' : 'rgba(255,255,255,0.3)', direction: 'ltr', fontVariantNumeric: 'tabular-nums' }}>
                {code}
              </div>
              {codeActive && (
                <div style={{ marginTop: 12, fontSize: 14, color: codeTimer < 60 ? '#f87171' : 'rgba(255,255,255,0.6)' }}>
                  ⏱ ينتهي خلال {pad(Math.floor(codeTimer / 60))}:{pad(codeTimer % 60)}
                </div>
              )}
              {codeActive && (
                <div style={{ marginTop: 10, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
                  👁 يستخدمه الآن: {data.filter(s => s.matched).length} طالب
                </div>
              )}
            </div>

            <div style={{ marginBottom: 14 }}>
              <label className="form-label">مدة الصلاحية</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {[2, 5, 10].map(d => (
                  <button key={d} onClick={() => setSelectedDuration(d)}
                    style={{ flex: 1, padding: '8px', borderRadius: 9, border: '1px solid', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, background: selectedDuration === d ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(255,255,255,0.06)', borderColor: selectedDuration === d ? 'transparent' : 'rgba(255,255,255,0.12)', color: '#fff' }}>
                    {d} دقائق
                  </button>
                ))}
              </div>
            </div>

            <button className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 14 }} onClick={generateCode}>
              🔄 توليد رمز جديد
            </button>
          </div>

          {/* CSV Upload */}
          <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '22px' }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 14px' }}>📤 رفع سجل Zoom/Meet</h3>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false) }}
              style={{
                border: `2px dashed ${dragOver ? '#7c3aed' : 'rgba(124,58,237,0.35)'}`,
                borderRadius: 12, padding: '24px', textAlign: 'center', cursor: 'pointer',
                background: dragOver ? 'rgba(124,58,237,0.1)' : 'transparent', transition: 'all 0.15s',
              }}
            >
              <div style={{ fontSize: 28, marginBottom: 8 }}>☁️</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>اسحب ملف CSV هنا</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>أو انقر للتحديد</div>
            </div>
          </div>
        </div>

        {/* Student log table */}
        <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 2px' }}>سجل حضور الطلاب</h3>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                حاضر: <span style={{ color: '#10b981', fontWeight: 600 }}>{data.filter(s => s.status === 'حاضر').length}</span> •
                متأخر: <span style={{ color: '#f59e0b', fontWeight: 600, marginRight: 4 }}>{data.filter(s => s.status === 'متأخر').length}</span> •
                غائب: <span style={{ color: '#f87171', fontWeight: 600, marginRight: 4 }}>{data.filter(s => s.status === 'غائب').length}</span>
              </div>
            </div>
            <button className="btn-outline" style={{ padding: '8px 16px', fontSize: 13 }}>تصدير CSV</button>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>الطالب</th>
                <th>وقت الدخول</th>
                <th>المدة</th>
                <th>الحالة</th>
                <th>إجراء</th>
              </tr>
            </thead>
            <tbody>
              {data.map(s => (
                <tr key={s.id}>
                  <td style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                      {s.name[0]}
                    </div>
                    <span>{s.name}</span>
                  </td>
                  <td style={{ color: 'rgba(255,255,255,0.55)', direction: 'ltr' }}>{s.time}</td>
                  <td style={{ color: 'rgba(255,255,255,0.55)' }}>{s.duration}</td>
                  <td>
                    <span className="badge" style={{ background: `${statusColor[s.status]}22`, color: statusColor[s.status], border: `1px solid ${statusColor[s.status]}44` }}>
                      {s.status}
                    </span>
                  </td>
                  <td>
                    {s.status === 'غائب' && (
                      <button onClick={() => setOverrideModal(s)}
                        style={{ background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '5px 12px', color: '#fbbf24', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                        تجاوز يدوي
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Override modal */}
      {overrideModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
          <div style={{ background: 'rgba(12,4,45,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '32px', maxWidth: 440, width: '100%' }}>
            <div style={{ fontSize: 28, textAlign: 'center', marginBottom: 14 }}>⚠️</div>
            <h3 style={{ fontSize: 17, fontWeight: 800, margin: '0 0 8px', textAlign: 'center' }}>تجاوز يدوي للحضور</h3>
            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', margin: '0 0 20px', textAlign: 'center' }}>
              أنت بصدد تعديل سجل حضور <strong>{overrideModal.name}</strong> يدوياً
            </p>
            <div style={{ marginBottom: 20 }}>
              <label className="form-label">سبب التجاوز (مطلوب)</label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="اذكر سبباً محدداً لتعديل سجل الحضور..."
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                style={{ resize: 'none' }}
              />
              {!overrideReason.trim() && <div style={{ fontSize: 11.5, color: '#f87171', marginTop: 4 }}>السبب مطلوب لتسجيل التجاوز في سجل المراجعة</div>}
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-outline" style={{ padding: '10px 20px', fontSize: 14 }} onClick={() => { setOverrideModal(null); setOverrideReason('') }}>إلغاء</button>
              <button
                style={{ background: overrideReason.trim() ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 9999, padding: '10px 24px', color: overrideReason.trim() ? '#fff' : 'rgba(255,255,255,0.3)', fontWeight: 600, fontSize: 14, cursor: overrideReason.trim() ? 'pointer' : 'not-allowed', fontFamily: 'inherit' }}
                onClick={() => overrideReason.trim() && handleOverride(overrideModal)}
              >تأكيد التجاوز</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
