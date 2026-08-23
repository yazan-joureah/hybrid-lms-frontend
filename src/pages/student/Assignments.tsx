import { useState } from 'react'

const assignments = [
  { id: 1, title: 'بناء مكوّن قائمة المهام', course: 'React المتقدم', due: '2026-08-05', status: 'pending', type: 'code' },
  { id: 2, title: 'تحليل مجموعة بيانات مالية', course: 'Python للتحليل المالي', due: '2026-08-02', status: 'submitted', submittedAt: '2026-08-01', type: 'file' },
  { id: 3, title: 'تصميم صفحة منتج متجاوبة', course: 'Figma UI/UX', due: '2026-07-28', status: 'graded', score: 92, maxScore: 100, feedback: 'عمل ممتاز! التصميم احترافي ومتوازن. احرص على ضبط التباعد في الشاشات الصغيرة.', type: 'file' },
  { id: 4, title: 'إعداد تقرير Redux Architecture', course: 'React المتقدم', due: '2026-08-10', status: 'pending', type: 'text' },
]

const statusConfig = {
  pending: { label: 'معلّق', color: '#f59e0b', badge: 'badge-warning' },
  submitted: { label: 'مُرسَل', color: '#06b6d4', badge: 'badge-info' },
  graded: { label: 'مُقيَّم', color: '#10b981', badge: 'badge-success' },
}

export default function Assignments() {
  const [selected, setSelected] = useState<typeof assignments[0] | null>(null)
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all')
  const [textAnswer, setTextAnswer] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const filtered = assignments.filter(a => filterStatus === 'all' || a.status === filterStatus)

  return (
    <div className="page-wrapper">
      {!selected ? (
        <>
          <div style={{ marginBottom: 24 }}>
            <h2 className="section-title">الواجبات</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '4px 0 0' }}>تابع وأكمل جميع واجباتك</p>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            {[['all','الكل'],['pending','معلّقة'],['submitted','مُرسَلة'],['graded','مُقيَّمة']].map(([v, l]) => (
              <button key={v} onClick={() => setFilterStatus(v as any)}
                style={{ padding: '8px 18px', borderRadius: 9999, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', background: filterStatus === v ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(255,255,255,0.07)', color: '#fff' }}>
                {l}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {filtered.map(a => {
              const cfg = statusConfig[a.status as keyof typeof statusConfig]
              const isLate = a.status === 'pending' && new Date(a.due) < new Date()
              return (
                <div key={a.id} onClick={() => setSelected(a)}
                  style={{
                    background: 'var(--bg-card)', backdropFilter: 'blur(20px)',
                    border: `1px solid ${isLate ? 'rgba(239,68,68,0.3)' : 'var(--border)'}`,
                    borderRadius: 16, padding: '18px 22px', cursor: 'pointer',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.transform = 'translateX(-2px)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.35)' }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.transform = 'translateX(0)'; (e.currentTarget as HTMLElement).style.borderColor = isLate ? 'rgba(239,68,68,0.3)' : 'var(--border)' }}
                >
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${cfg.color}22`, border: `1px solid ${cfg.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      {a.type === 'code' ? '💻' : a.type === 'file' ? '📄' : '✍️'}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{a.title}</div>
                      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)', display: 'flex', gap: 12 }}>
                        <span>📚 {a.course}</span>
                        <span style={{ color: isLate ? '#f87171' : 'rgba(255,255,255,0.5)' }}>
                          📅 {isLate ? 'منتهية الصلاحية: ' : 'تاريخ التسليم: '}{a.due}
                        </span>
                        {a.status === 'graded' && <span>🏅 {(a as any).score}/{(a as any).maxScore}</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span className={`badge ${cfg.badge}`}>{cfg.label}</span>
                    <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 16 }}>←</span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      ) : (
        /* Assignment detail */
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <button onClick={() => { setSelected(null); setSubmitted(false); setTextAnswer('') }}
            style={{ background: 'none', border: 'none', color: '#a855f7', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6, padding: 0, marginBottom: 20 }}>
            ← العودة للواجبات
          </button>

          <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 20, padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 6px' }}>{selected.title}</h2>
                <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', display: 'flex', gap: 14 }}>
                  <span>📚 {selected.course}</span>
                  <span>📅 {selected.due}</span>
                </div>
              </div>
              <span className={`badge ${statusConfig[selected.status as keyof typeof statusConfig].badge}`} style={{ fontSize: 13, padding: '5px 14px' }}>
                {statusConfig[selected.status as keyof typeof statusConfig].label}
              </span>
            </div>

            <div className="divider" style={{ marginBottom: 20 }} />

            {/* Graded view */}
            {selected.status === 'graded' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
                  <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 14, padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: 36, fontWeight: 800, color: '#34d399', marginBottom: 4 }}>{(selected as any).score}%</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>الدرجة المكتسبة</div>
                  </div>
                  <div style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 14, padding: '20px', textAlign: 'center' }}>
                    <div style={{ fontSize: 36, fontWeight: 800, color: '#c4b5fd', marginBottom: 4 }}>ممتاز</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>التقييم</div>
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '16px' }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 8 }}>تعليق المدرّس:</div>
                  <p style={{ fontSize: 14, lineHeight: 1.7, margin: 0, color: 'rgba(255,255,255,0.8)' }}>{(selected as any).feedback}</p>
                </div>
              </div>
            )}

            {/* Submitted view */}
            {selected.status === 'submitted' && (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
                <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>تم الإرسال بنجاح</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }}>بتاريخ: {(selected as any).submittedAt}</div>
                <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.4)', marginTop: 8 }}>بانتظار مراجعة المدرّس...</div>
              </div>
            )}

            {/* Pending — submission form */}
            {selected.status === 'pending' && !submitted && (
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 700, margin: '0 0 16px' }}>تفاصيل الواجب</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, marginBottom: 24 }}>
                  قم ببناء مكوّن قائمة مهام كامل باستخدام React وTypeScript مع دعم إضافة وحذف وتحديد حالة المهام. يجب أن يكون التصميم متجاوباً ومراعياً لأفضل ممارسات React.
                </p>

                {selected.type === 'file' && (
                  <div style={{
                    border: '2px dashed rgba(124,58,237,0.35)', borderRadius: 14, padding: '32px',
                    textAlign: 'center', marginBottom: 20, cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    <div style={{ fontSize: 32, marginBottom: 10 }}>☁️</div>
                    <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4 }}>اسحب الملف هنا أو انقر للاختيار</div>
                    <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)' }}>PDF, ZIP, PNG — حجم أقصى 50MB</div>
                  </div>
                )}

                {selected.type === 'text' && (
                  <div style={{ marginBottom: 20 }}>
                    <label className="form-label">إجابتك</label>
                    <textarea
                      className="form-input"
                      rows={8}
                      placeholder="اكتب إجابتك هنا..."
                      value={textAnswer}
                      onChange={e => setTextAnswer(e.target.value)}
                      style={{ resize: 'vertical', minHeight: 160 }}
                    />
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn-outline" style={{ padding: '11px 24px', fontSize: 14 }} onClick={() => setSelected(null)}>إلغاء</button>
                  <button className="btn-primary" style={{ padding: '11px 28px', fontSize: 14 }} onClick={() => setSubmitted(true)}>
                    إرسال الواجب ✓
                  </button>
                </div>
              </div>
            )}

            {submitted && (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ fontSize: 52, marginBottom: 14 }}>🎉</div>
                <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8 }}>أُرسل الواجب بنجاح!</div>
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.55)' }}>ستصلك إشعارات عند مراجعة المدرّس لواجبك</div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
