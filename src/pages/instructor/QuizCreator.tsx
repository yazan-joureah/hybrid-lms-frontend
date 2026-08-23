import { useState } from 'react'

type Question = { id: number; text: string; options: string[]; correct: number; type: 'mcq' | 'truefalse' }

export default function QuizCreator() {
  const [title, setTitle] = useState('اختبار React المتقدم — الوحدة 3')
  const [timeLimit, setTimeLimit] = useState(30)
  const [shuffle, setShuffle] = useState(true)
  const [strictMode, setStrictMode] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([
    { id: 1, text: 'ما هو الـ Hook المستخدم لحفظ القيم المحسوبة؟', options: ['useState', 'useMemo', 'useCallback', 'useRef'], correct: 1, type: 'mcq' },
    { id: 2, text: 'React يستخدم Virtual DOM لتحسين الأداء', options: ['صحيح', 'خطأ'], correct: 0, type: 'truefalse' },
  ])

  const addQuestion = (type: 'mcq' | 'truefalse') => {
    setQuestions(prev => [...prev, {
      id: Date.now(), text: 'سؤال جديد', type,
      options: type === 'truefalse' ? ['صحيح', 'خطأ'] : ['الخيار 1', 'الخيار 2', 'الخيار 3', 'الخيار 4'],
      correct: 0,
    }])
  }

  const updateQuestion = (id: number, text: string) => setQuestions(prev => prev.map(q => q.id === id ? { ...q, text } : q))
  const updateOption = (qId: number, oIdx: number, text: string) => setQuestions(prev => prev.map(q => q.id === qId ? { ...q, options: q.options.map((o, i) => i === oIdx ? text : o) } : q))
  const setCorrect = (qId: number, idx: number) => setQuestions(prev => prev.map(q => q.id === qId ? { ...q, correct: idx } : q))
  const removeQ = (id: number) => setQuestions(prev => prev.filter(q => q.id !== id))

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 className="section-title">منشئ الاختبارات</h2>
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '4px 0 0' }}>أنشئ اختبارات متنوعة للطلاب</p>
        </div>
        <button className="btn-primary" style={{ padding: '10px 24px', fontSize: 14 }}>💾 حفظ ونشر الاختبار</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 22 }}>
        <div>
          {/* Quiz settings */}
          <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '22px', marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 16px' }}>إعدادات الاختبار</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
              <div>
                <label className="form-label">عنوان الاختبار</label>
                <input className="form-input" value={title} onChange={e => setTitle(e.target.value)} />
              </div>
              <div>
                <label className="form-label">الوقت المسموح (دقائق)</label>
                <input className="form-input" type="number" value={timeLimit} onChange={e => setTimeLimit(Number(e.target.value))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 24 }}>
              {[
                { label: '🔀 خلط الأسئلة', value: shuffle, set: setShuffle },
                { label: '🔒 وضع الامتحان الصارم', value: strictMode, set: setStrictMode },
              ].map(t => (
                <div key={t.label} style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }} onClick={() => t.set(!t.value)}>
                  <div className={`toggle${t.value ? ' on' : ''}`} />
                  <span style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.7)' }}>{t.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Questions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 16 }}>
            {questions.map((q, qi) => (
              <div key={q.id} style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '20px' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>{qi + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span className={`badge ${q.type === 'mcq' ? 'badge-primary' : 'badge-info'}`}>{q.type === 'mcq' ? 'اختيار متعدد' : 'صح/خطأ'}</span>
                      <button onClick={() => removeQ(q.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 15 }}>🗑</button>
                    </div>
                    <input
                      className="form-input"
                      value={q.text}
                      onChange={e => updateQuestion(q.id, e.target.value)}
                      style={{ marginBottom: 12 }}
                    />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {q.options.map((opt, oi) => (
                        <div key={oi} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <button
                            onClick={() => setCorrect(q.id, oi)}
                            style={{ width: 24, height: 24, borderRadius: '50%', border: '2px solid', borderColor: q.correct === oi ? '#10b981' : 'rgba(255,255,255,0.2)', background: q.correct === oi ? '#10b981' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff', fontSize: 11, fontWeight: 700 }}>
                            {q.correct === oi ? '✓' : ''}
                          </button>
                          <input className="form-input" value={opt} onChange={e => updateOption(q.id, oi, e.target.value)} style={{ flex: 1, paddingTop: 8, paddingBottom: 8, borderColor: q.correct === oi ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)' }} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '12px', fontSize: 14 }} onClick={() => addQuestion('mcq')}>
              + إضافة سؤال اختيار متعدد
            </button>
            <button className="btn-outline" style={{ flex: 1, justifyContent: 'center', padding: '12px', fontSize: 14 }} onClick={() => addQuestion('truefalse')}>
              + إضافة سؤال صح/خطأ
            </button>
          </div>
        </div>

        {/* Sidebar summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '22px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: '0 0 14px' }}>ملخص الاختبار</h3>
            {[['📝', 'الأسئلة', String(questions.length)], ['⏱', 'الوقت', `${timeLimit} دقيقة`], ['🔀', 'خلط الأسئلة', shuffle ? 'مفعّل' : 'معطّل'], ['🔒', 'الوضع الصارم', strictMode ? 'مفعّل' : 'معطّل']].map(([i, l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: 13.5 }}>
                <span style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', gap: 7 }}><span>{i}</span><span>{l}</span></span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
