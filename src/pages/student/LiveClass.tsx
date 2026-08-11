import { useState, useEffect } from 'react'

const chatMessages = [
  { id: 1, user: 'أحمد محمد', avatar: 'أ', msg: 'سؤال: كيف نتعامل مع الـ async state في React؟', time: '6:32م' },
  { id: 2, user: 'سارة الأحمد', avatar: 'س', msg: 'شكراً للشرح الواضح!', time: '6:34م' },
  { id: 3, user: 'خالد العلي', avatar: 'خ', msg: 'المدرّس: سنتناول ذلك في القسم القادم', time: '6:35م', isInstructor: true },
  { id: 4, user: 'محمد العمر', avatar: 'م', msg: 'هل يمكن مشاركة الشاشة؟', time: '6:36م' },
]

export default function LiveClass() {
  const [attendanceCode, setAttendanceCode] = useState(['', '', '', ''])
  const [attendanceTimer, setAttendanceTimer] = useState(180)
  const [attendanceSubmitted, setAttendanceSubmitted] = useState(false)
  const [attendanceExpired, setAttendanceExpired] = useState(false)
  const [chatMsg, setChatMsg] = useState('')
  const [messages, setMessages] = useState(chatMessages)
  const [handRaised, setHandRaised] = useState(false)
  const [activeTab, setActiveTab] = useState<'chat' | 'quiz'>('chat')
  const [quizActive, setQuizActive] = useState(true)
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null)

  const pad = (n: number) => String(n).padStart(2, '0')

  useEffect(() => {
    if (attendanceTimer > 0 && !attendanceSubmitted) {
      const iv = setInterval(() => setAttendanceTimer(p => { if (p <= 1) { setAttendanceExpired(true); return 0 } return p - 1 }), 1000)
      return () => clearInterval(iv)
    }
  }, [attendanceSubmitted])

  const handleCodeInput = (idx: number, val: string) => {
    if (val.length > 1 || !/^\d*$/.test(val)) return
    const next = [...attendanceCode]
    next[idx] = val
    setAttendanceCode(next)
    if (val && idx < 3) document.getElementById(`att-${idx + 1}`)?.focus()
  }

  const handleAttendanceSubmit = () => {
    if (attendanceCode.join('').length === 4) setAttendanceSubmitted(true)
  }

  const sendMessage = () => {
    if (!chatMsg.trim()) return
    setMessages(prev => [...prev, { id: Date.now(), user: 'أنت', avatar: 'أ', msg: chatMsg, time: 'الآن' }])
    setChatMsg('')
  }

  return (
    <div className="page-wrapper" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, height: 'calc(100vh - 120px)' }}>
        {/* Main video area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Video player */}
          <div style={{ flex: 1, background: '#000', borderRadius: 18, overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.1)', minHeight: 300 }}>
            <img
              src="https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=900&h=500&fit=crop&auto=format"
              alt="live session"
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }}
            />
            {/* Live badge */}
            <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
              <span className="live-badge"><span className="live-dot" />مباشر الآن</span>
              <span style={{ background: 'rgba(0,0,0,0.6)', padding: '3px 10px', borderRadius: 9999, fontSize: 12, color: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(6px)' }}>👥 34 طالب</span>
            </div>
            <div style={{ position: 'absolute', bottom: 16, right: 16 }}>
              <div style={{ background: 'rgba(0,0,0,0.7)', padding: '8px 14px', borderRadius: 10, backdropFilter: 'blur(8px)' }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>React المتقدم — الحصة 8</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>محمد الخالدي</div>
              </div>
            </div>
            {/* Controls */}
            <div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: 10 }}>
              {['🎤', '📷', '🖥️', '⚙️'].map(icon => (
                <button key={icon} style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', fontSize: 16, backdropFilter: 'blur(8px)' }}>{icon}</button>
              ))}
            </div>
          </div>

          {/* Attendance widget */}
          <div style={{
            background: attendanceExpired ? 'rgba(239,68,68,0.1)' : attendanceSubmitted ? 'rgba(16,185,129,0.1)' : 'var(--bg-card)',
            backdropFilter: 'blur(20px)',
            border: `1px solid ${attendanceExpired ? 'rgba(239,68,68,0.3)' : attendanceSubmitted ? 'rgba(16,185,129,0.3)' : 'var(--border)'}`,
            borderRadius: 16, padding: '18px 20px',
          }}>
            {!attendanceSubmitted && !attendanceExpired ? (
              <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>🔢 رمز الحضور</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
                    أدخل الرمز المكوّن من 4 أرقام — ينتهي خلال{' '}
                    <span style={{ color: attendanceTimer < 30 ? '#f87171' : '#fbbf24', fontWeight: 700 }}>
                      {pad(Math.floor(attendanceTimer / 60))}:{pad(attendanceTimer % 60)}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }} dir="ltr">
                  {attendanceCode.map((v, i) => (
                    <input
                      key={i}
                      id={`att-${i}`}
                      value={v}
                      onChange={e => handleCodeInput(i, e.target.value)}
                      maxLength={1}
                      style={{
                        width: 46, height: 52, borderRadius: 10, textAlign: 'center', fontSize: 22, fontWeight: 800,
                        background: 'rgba(255,255,255,0.07)', border: `1.5px solid ${v ? '#7c3aed' : 'rgba(255,255,255,0.15)'}`,
                        color: '#fff', outline: 'none', fontFamily: 'inherit',
                      }}
                    />
                  ))}
                  <button
                    className="btn-primary"
                    style={{ padding: '11px 20px', fontSize: 14 }}
                    onClick={handleAttendanceSubmit}
                    disabled={attendanceCode.join('').length < 4}
                  >تأكيد</button>
                </div>
              </div>
            ) : attendanceSubmitted ? (
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <span style={{ fontSize: 28 }}>✅</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#34d399' }}>تم تسجيل حضورك بنجاح!</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>تم تسجيل حضورك في هذه الحصة</div>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <span style={{ fontSize: 28 }}>⌛</span>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#f87171' }}>انتهت صلاحية رمز الحضور</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>تواصل مع المدرّس للحصول على رمز جديد</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Side panel */}
        <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 18, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ padding: '12px 12px 0', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="tab-bar">
              <div className={`tab-item${activeTab === 'chat' ? ' active' : ''}`} onClick={() => setActiveTab('chat')}>💬 الدردشة</div>
              <div className={`tab-item${activeTab === 'quiz' ? ' active' : ''}`} onClick={() => setActiveTab('quiz')}>
                📝 اختبار سريع {quizActive && <span style={{ marginRight: 4, width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'pulse-dot 1.4s infinite' }} />}
              </div>
            </div>
          </div>

          {activeTab === 'chat' && (
            <>
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                {messages.map(m => (
                  <div key={m.id} style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                    <div style={{
                      width: 30, height: 30, borderRadius: '50%', flexShrink: 0,
                      background: m.isInstructor ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(255,255,255,0.12)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: 700, color: '#fff',
                    }}>{m.avatar}</div>
                    <div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: m.isInstructor ? '#c4b5fd' : '#fff' }}>{m.user}</span>
                        <span style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)' }}>{m.time}</span>
                      </div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.5, marginTop: 2 }}>{m.msg}</div>
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8 }}>
                <button
                  onClick={() => setHandRaised(!handRaised)}
                  style={{ width: 38, height: 38, borderRadius: '50%', border: `1.5px solid ${handRaised ? '#f59e0b' : 'rgba(255,255,255,0.15)'}`, background: handRaised ? 'rgba(245,158,11,0.2)' : 'transparent', cursor: 'pointer', fontSize: 18, flexShrink: 0, transition: 'all 0.15s' }}
                >✋</button>
                <input
                  className="form-input"
                  value={chatMsg}
                  onChange={e => setChatMsg(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="اكتب رسالتك..."
                  style={{ flex: 1, paddingTop: 8, paddingBottom: 8, fontSize: 13 }}
                />
                <button onClick={sendMessage} style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', cursor: 'pointer', fontSize: 16, flexShrink: 0, color: '#fff' }}>↑</button>
              </div>
            </>
          )}

          {activeTab === 'quiz' && (
            <div style={{ flex: 1, padding: '16px', overflowY: 'auto' }}>
              {quizActive ? (
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
                    <span className="live-badge"><span className="live-dot" />اختبار مباشر</span>
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 18, lineHeight: 1.5 }}>
                    ما الفرق بين useMemo و useCallback في React؟
                  </div>
                  {[
                    'useMemo يحفظ قيمة، useCallback يحفظ دالة',
                    'كلاهما يحفظان قيمة محسوبة',
                    'useMemo للدوال، useCallback للقيم',
                    'لا فرق بينهما',
                  ].map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => setQuizAnswer(i)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'right', marginBottom: 8,
                        padding: '11px 14px', borderRadius: 10, border: '1.5px solid',
                        borderColor: quizAnswer === i ? '#7c3aed' : 'rgba(255,255,255,0.1)',
                        background: quizAnswer === i ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.04)',
                        color: '#fff', fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'all 0.15s',
                      }}
                    >{opt}</button>
                  ))}
                  {quizAnswer !== null && (
                    <button
                      style={{ background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: 9999, padding: '10px 24px', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', width: '100%', marginTop: 8 }}
                      onClick={() => setQuizActive(false)}
                    >إرسال الإجابة</button>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>🎯</div>
                  <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: '#34d399' }}>إجابة صحيحة!</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>سيظهر الاختبار التالي قريباً</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
