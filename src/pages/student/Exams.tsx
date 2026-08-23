import { useState, useEffect } from 'react'

const questions = [
  {
    id: 1,
    text: 'ما هو الـ Hook المستخدم لإدارة الحالة في React؟',
    options: ['useState', 'useEffect', 'useContext', 'useReducer'],
    correct: 0,
  },
  {
    id: 2,
    text: 'أي من التالي يُستخدم للتعامل مع العمليات الجانبية (Side Effects)؟',
    options: ['useState', 'useEffect', 'useMemo', 'useRef'],
    correct: 1,
  },
  {
    id: 3,
    text: 'ما الفرق الأساسي بين Props وState؟',
    options: ['لا فرق بينهما', 'Props يمرر من الأب، State يُدار داخلياً', 'State يمرر من الأب، Props يُدار داخلياً', 'كلاهما خارجيان'],
    correct: 1,
  },
  {
    id: 4,
    text: 'ما هو الـ Virtual DOM؟',
    options: ['نسخة افتراضية خفيفة من DOM الحقيقي', 'قاعدة بيانات في الذاكرة', 'مكتبة خارجية لـ React', 'نوع من الـ Hooks'],
    correct: 0,
  },
  {
    id: 5,
    text: 'ما هو الـ key prop في القوائم؟',
    options: ['خاصية للتنسيق', 'معرّف فريد يساعد React في التعرف على العناصر', 'اختياري دائماً', 'يستخدم فقط مع الـ arrays'],
    correct: 1,
  },
]

const pastResults = [
  { id: 1, title: 'اختبار JavaScript الأساسيات', date: '2026-07-20', score: 88, total: 100, passed: true },
  { id: 2, title: 'اختبار HTML & CSS', date: '2026-07-10', score: 76, total: 100, passed: true },
]

export default function Exams() {
  const [view, setView] = useState<'list' | 'exam' | 'results'>('list')
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<Record<number, number>>({})
  const [timeLeft, setTimeLeft] = useState(1800)
  const [showConfirm, setShowConfirm] = useState(false)
  const [examResult, setExamResult] = useState<{ score: number; passed: boolean } | null>(null)

  const pad = (n: number) => String(n).padStart(2, '0')

  useEffect(() => {
    if (view !== 'exam') return
    if (timeLeft <= 0) { submitExam(); return }
    const iv = setInterval(() => setTimeLeft(p => p - 1), 1000)
    return () => clearInterval(iv)
  }, [view, timeLeft])

  const submitExam = () => {
    const correct = questions.filter((q, i) => answers[i] === q.correct).length
    const score = Math.round((correct / questions.length) * 100)
    setExamResult({ score, passed: score >= 60 })
    setView('results')
    setShowConfirm(false)
  }

  return (
    <div className="page-wrapper">
      {view === 'list' && (
        <>
          <div style={{ marginBottom: 24 }}>
            <h2 className="section-title">الاختبارات</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 14, margin: '4px 0 0' }}>اختبر معلوماتك وتتبع نتائجك</p>
          </div>

          {/* Available exams */}
          <div style={{ marginBottom: 32 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>الاختبارات المتاحة</h3>
            <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '20px 24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(124,58,237,0.2)', border: '1px solid rgba(124,58,237,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>📝</div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 4 }}>اختبار React المتقدم</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', display: 'flex', gap: 16 }}>
                      <span>📚 React المتقدم</span>
                      <span>❓ {questions.length} أسئلة</span>
                      <span>⏱ 30 دقيقة</span>
                    </div>
                  </div>
                </div>
                <button className="btn-primary" style={{ padding: '10px 24px', fontSize: 14 }}
                  onClick={() => { setView('exam'); setCurrentQ(0); setAnswers({}); setTimeLeft(1800) }}>
                  ابدأ الاختبار
                </button>
              </div>
            </div>
          </div>

          {/* Past results */}
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>النتائج السابقة</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pastResults.map(r => (
                <div key={r.id} style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: r.passed ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                      {r.passed ? '🏅' : '❌'}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 3 }}>{r.title}</div>
                      <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)' }}>{r.date}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: r.passed ? '#34d399' : '#f87171' }}>{r.score}%</div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>النتيجة</div>
                    </div>
                    <span className={`badge ${r.passed ? 'badge-success' : 'badge-danger'}`}>{r.passed ? 'ناجح' : 'راسب'}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {view === 'exam' && (
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {/* Header */}
          <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 16, padding: '14px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>السؤال {currentQ + 1} من {questions.length}</span>
              <div style={{ display: 'flex', gap: 5 }}>
                {questions.map((_, i) => (
                  <div key={i} style={{ width: 8, height: 8, borderRadius: '50%', background: answers[i] !== undefined ? '#7c3aed' : i === currentQ ? '#a855f7' : 'rgba(255,255,255,0.2)' }} />
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: timeLeft < 300 ? '#f87171' : '#fff' }}>
              <span>⏱</span>
              <span style={{ fontSize: 16, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                {pad(Math.floor(timeLeft / 60))}:{pad(timeLeft % 60)}
              </span>
            </div>
          </div>

          {/* Question */}
          <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, padding: '28px' }}>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 24px', lineHeight: 1.5 }}>
              {questions[currentQ].text}
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
              {questions[currentQ].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => setAnswers(prev => ({ ...prev, [currentQ]: i }))}
                  style={{
                    textAlign: 'right', padding: '14px 18px', borderRadius: 12, border: '1.5px solid',
                    borderColor: answers[currentQ] === i ? '#7c3aed' : 'rgba(255,255,255,0.1)',
                    background: answers[currentQ] === i ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)',
                    color: '#fff', fontSize: 14.5, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}
                >
                  <div style={{ width: 26, height: 26, borderRadius: '50%', border: `1.5px solid ${answers[currentQ] === i ? '#7c3aed' : 'rgba(255,255,255,0.2)'}`, background: answers[currentQ] === i ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700 }}>
                    {answers[currentQ] === i ? '✓' : String.fromCharCode(65 + i)}
                  </div>
                  {opt}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <button className="btn-outline" style={{ padding: '10px 20px', fontSize: 14 }} disabled={currentQ === 0} onClick={() => setCurrentQ(p => p - 1)}>
                ← السابق
              </button>
              {currentQ < questions.length - 1 ? (
                <button className="btn-primary" style={{ padding: '10px 20px', fontSize: 14 }} onClick={() => setCurrentQ(p => p + 1)}>
                  التالي →
                </button>
              ) : (
                <button style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 9999, padding: '10px 24px', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}
                  onClick={() => setShowConfirm(true)}>
                  إنهاء الاختبار ✓
                </button>
              )}
            </div>
          </div>

          {/* Confirm dialog */}
          {showConfirm && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
              <div style={{ background: 'rgba(12,4,45,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, padding: '32px', maxWidth: 420, width: '100%', textAlign: 'center' }}>
                <div style={{ fontSize: 40, marginBottom: 14 }}>⚠️</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, margin: '0 0 10px' }}>تأكيد إنهاء الاختبار</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: '0 0 24px', lineHeight: 1.6 }}>
                  أجبت على {Object.keys(answers).length} من {questions.length} أسئلة. هل أنت متأكد من الإنهاء؟
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <button className="btn-outline" style={{ padding: '11px 24px', fontSize: 14 }} onClick={() => setShowConfirm(false)}>إلغاء</button>
                  <button style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 9999, padding: '11px 28px', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }} onClick={submitExam}>
                    نعم، إنهاء الاختبار
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {view === 'results' && examResult && (
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: `1px solid ${examResult.passed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 22, padding: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: 60, marginBottom: 16 }}>{examResult.passed ? '🎉' : '📚'}</div>
            <h2 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 8px', color: examResult.passed ? '#34d399' : '#f87171' }}>
              {examResult.passed ? 'مبروك! اجتزت الاختبار' : 'لم تجتز الاختبار هذه المرة'}
            </h2>
            <div style={{ fontSize: 52, fontWeight: 800, color: '#fff', margin: '20px 0' }}>{examResult.score}%</div>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', marginBottom: 30 }}>
              {[
                ['الدرجة', `${examResult.score}/100`],
                ['الحالة', examResult.passed ? 'ناجح' : 'راسب'],
                ['الأسئلة', `${questions.length} سؤال`],
              ].map(([l, v]) => (
                <div key={l} style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 12, padding: '12px 20px' }}>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>{l}</div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Answer review */}
            <div style={{ textAlign: 'right', marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 14 }}>مراجعة الإجابات</h3>
              {questions.map((q, i) => (
                <div key={i} style={{ background: answers[i] === q.correct ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${answers[i] === q.correct ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, borderRadius: 12, padding: '12px 16px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13.5 }}>{q.text}</span>
                    <span style={{ fontSize: 18 }}>{answers[i] === q.correct ? '✅' : '❌'}</span>
                  </div>
                  {answers[i] !== q.correct && (
                    <div style={{ fontSize: 12, color: '#34d399', marginTop: 6 }}>الإجابة الصحيحة: {q.options[q.correct]}</div>
                  )}
                </div>
              ))}
            </div>

            <button className="btn-primary" style={{ padding: '12px 36px', fontSize: 15 }} onClick={() => setView('list')}>
              العودة للاختبارات
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
