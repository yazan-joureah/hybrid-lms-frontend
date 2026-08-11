import { useState } from 'react'

const submissions = [
  { id: 1, student: 'فاطمة الزهراء', avatar: 'ف', assignment: 'بناء مكوّن قائمة المهام', course: 'React المتقدم', date: '2026-07-30', status: 'pending', content: 'قمت ببناء مكوّن قائمة المهام باستخدام React Hooks مع دعم الإضافة والحذف وتعديل الحالة...' },
  { id: 2, student: 'علي حسن', avatar: 'ع', assignment: 'تحليل مجموعة بيانات مالية', course: 'Python', date: '2026-07-29', status: 'pending', content: 'استخدمت مكتبة Pandas لتحليل البيانات المالية وإنشاء تقارير ومخططات...' },
  { id: 3, student: 'نورة السعيد', avatar: 'ن', assignment: 'تصميم صفحة منتج', course: 'Figma UI/UX', date: '2026-07-28', status: 'graded', score: 88, feedback: 'تصميم رائع ومنظم جيداً' },
]

export default function GradingManager() {
  const [selected, setSelected] = useState<typeof submissions[0] | null>(null)
  const [score, setScore] = useState('')
  const [feedback, setFeedback] = useState('')
  const [filter, setFilter] = useState<'all' | 'pending' | 'graded'>('all')
  const [data, setData] = useState(submissions)

  const filtered = data.filter(s => filter === 'all' || s.status === filter)

  const publishGrade = () => {
    if (!selected || !score) return
    setData(prev => prev.map(s => s.id === selected.id ? { ...s, status: 'graded', score: Number(score), feedback } : s))
    setSelected(null)
    setScore('')
    setFeedback('')
  }

  return (
    <div className="page-wrapper">
      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 22 }}>
        <div>
          <div style={{ marginBottom: 24 }}>
            <h2 className="section-title">التقييمات</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '4px 0 0' }}>مراجعة وتقييم تسليمات الطلاب</p>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {[['all', 'الكل'], ['pending', 'معلقة'], ['graded', 'مُقيَّمة']].map(([v, l]) => (
              <button key={v} onClick={() => setFilter(v as any)}
                style={{ padding: '7px 16px', borderRadius: 9999, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: filter === v ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(255,255,255,0.07)', color: '#fff' }}>
                {l}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {filtered.map(s => (
              <div key={s.id}
                onClick={() => { setSelected(s); setScore((s as any).score?.toString() || ''); setFeedback((s as any).feedback || '') }}
                style={{
                  background: selected?.id === s.id ? 'rgba(124,58,237,0.15)' : 'var(--bg-card)',
                  backdropFilter: 'blur(20px)',
                  border: `1px solid ${selected?.id === s.id ? 'rgba(124,58,237,0.4)' : 'var(--border)'}`,
                  borderRadius: 16, padding: '16px 20px', cursor: 'pointer', transition: 'all 0.15s',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>{s.avatar}</div>
                    <div>
                      <div style={{ fontSize: 14.5, fontWeight: 700, marginBottom: 3 }}>{s.student}</div>
                      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)' }}>{s.assignment} • {s.course}</div>
                      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>📅 {s.date}</div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'left' }}>
                    {s.status === 'graded' ? (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 800, color: '#34d399' }}>{(s as any).score}%</div>
                        <span className="badge badge-success">مُقيَّم</span>
                      </div>
                    ) : (
                      <span className="badge badge-warning">معلّق</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Grading interface */}
        {selected && (
          <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>تقييم التسليم</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 20 }}>✕</button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 14, padding: '16px' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 8 }}>إجابة الطالب:</div>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: 'rgba(255,255,255,0.8)', margin: 0 }}>{selected.content}</p>
            </div>

            {/* Rubric */}
            <div>
              <label className="form-label">الدرجة (من 100)</label>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input
                  className="form-input"
                  type="number" min="0" max="100"
                  placeholder="0-100"
                  value={score}
                  onChange={e => setScore(e.target.value)}
                  style={{ flex: 1 }}
                />
                {score && (
                  <div style={{
                    fontSize: 22, fontWeight: 800,
                    color: Number(score) >= 70 ? '#34d399' : Number(score) >= 50 ? '#fbbf24' : '#f87171',
                  }}>{score}</div>
                )}
              </div>
              {/* Quick grade buttons */}
              <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                {[60, 70, 80, 90, 100].map(v => (
                  <button key={v} onClick={() => setScore(String(v))}
                    style={{ flex: 1, padding: '6px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.12)', background: score === String(v) ? 'rgba(124,58,237,0.2)' : 'transparent', color: '#fff', fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                    {v}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="form-label">التعليق والملاحظات</label>
              <textarea className="form-input" rows={5} placeholder="أضف تعليقاً بنّاءً للطالب..." value={feedback} onChange={e => setFeedback(e.target.value)} style={{ resize: 'none' }} />
            </div>

            <button
              style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 9999, padding: '12px', color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
              onClick={publishGrade}
              disabled={!score || !feedback}
            >
              📤 نشر الدرجة
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
