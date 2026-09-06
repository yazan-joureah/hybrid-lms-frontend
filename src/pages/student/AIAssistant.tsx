import { useState, useRef, useEffect } from 'react'
import { useStudentAI } from '../../hooks/ai/useStudentAI'

const suggested = [
  'لخّص الدرس الأخير',
  'أنشئ اختباراً تجريبياً',
  'اشرح مفهوم الـ Hooks',
  'ما هي الواجبات المعلقة؟',
  'خطة مراجعة لنهاية الأسبوع',
]

export default function AIAssistant() {
  const {
    courses, loadingCourses,
    selectedCourseId, setSelectedCourseId,
    messages, loadingHistory, sending,
    sendMessage,
  } = useStudentAI()

  const [input, setInput] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, sending])

  const handleSend = (text: string) => {
    if (!text.trim() || sending) return
    void sendMessage(text)
    setInput('')
  }

  const selectedCourseTitle = courses.find(c => c.course_id._id === selectedCourseId)?.course_id.title || ''

  if (loadingCourses) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - var(--header-height))', color: 'rgba(255,255,255,0.5)' }}>
        ...جارٍ التحميل
      </div>
    )
  }

  if (courses.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 'calc(100vh - var(--header-height))', color: 'rgba(255,255,255,0.5)', gap: 10 }}>
        <div style={{ fontSize: 44 }}>🤖</div>
        <div>سجّل في كورس واحد على الأقل لتتمكن من استخدام المساعد الذكي.</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--header-height))', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 28px', background: 'rgba(8,3,32,0.5)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🤖</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>المساعد الذكي Edujar AI</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>
            {selectedCourseTitle ? `كورس: ${selectedCourseTitle}` : 'اختر كورساً من القائمة'}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Chat */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {loadingHistory ? (
              <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>...جارٍ تحميل المحادثة</div>
            ) : messages.length === 0 ? (
              <div style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center', marginTop: 40 }}>
                لا توجد محادثة سابقة بعد. اكتب سؤالك بالأسفل للبدء 👋
              </div>
            ) : (
              messages.map(m => (
                <div key={m.id} style={{ display: 'flex', gap: 12, flexDirection: m.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: m.role === 'assistant' ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                    {m.role === 'assistant' ? '🤖' : 'أ'}
                  </div>
                  <div style={{ maxWidth: '72%' }}>
                    <div style={{
                      background: m.flagged
                        ? 'rgba(245,158,11,0.12)'
                        : (m.role === 'assistant' ? 'rgba(28,10,80,0.9)' : 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(168,85,247,0.3))'),
                      border: `1px solid ${m.flagged ? 'rgba(245,158,11,0.4)' : (m.role === 'assistant' ? 'rgba(255,255,255,0.1)' : 'rgba(124,58,237,0.4)')}`,
                      borderRadius: m.role === 'assistant' ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                      padding: '12px 16px',
                    }}>
                      {m.flagged && (
                        <div style={{ fontSize: 12, color: '#fbbf24', fontWeight: 700, marginBottom: 6 }}>⚠️ تنبيه</div>
                      )}
                      <pre style={{ margin: 0, fontFamily: 'inherit', fontSize: 14, lineHeight: 1.65, whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.9)' }}>{m.text}</pre>
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 5, textAlign: m.role === 'user' ? 'right' : 'left', direction: 'ltr' }}>{m.time}</div>
                  </div>
                </div>
              ))
            )}

            {sending && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🤖</div>
                <div style={{ background: 'rgba(28,10,80,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px 16px 16px 16px', padding: '14px 18px', display: 'flex', gap: 5, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: '#a855f7', animation: `pulse-dot 1.4s ease-in-out ${i * 0.2}s infinite` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          {/* Suggested prompts */}
          <div style={{ padding: '8px 28px', display: 'flex', gap: 8, overflowX: 'auto', borderTop: '1px solid rgba(255,255,255,0.06)' }} className="no-scrollbar">
            {suggested.map(s => (
              <button
                key={s}
                onClick={() => handleSend(s)}
                disabled={sending}
                style={{
                  whiteSpace: 'nowrap', padding: '7px 14px', borderRadius: 9999, fontSize: 12.5, fontWeight: 500,
                  background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
                  color: '#c4b5fd', cursor: sending ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                  transition: 'all 0.15s', opacity: sending ? 0.5 : 1,
                }}
              >{s}</button>
            ))}
          </div>

          {/* Input */}
          <div style={{ padding: '14px 28px 20px', display: 'flex', gap: 10 }}>
            <input
              className="form-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend(input)}
              placeholder="اكتب سؤالك هنا..."
              disabled={sending}
              style={{ flex: 1, paddingTop: 12, paddingBottom: 12 }}
            />
            <button
              onClick={() => handleSend(input)}
              disabled={sending || !input.trim()}
              style={{
                width: 46, height: 46, borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none',
                cursor: (sending || !input.trim()) ? 'not-allowed' : 'pointer', opacity: (sending || !input.trim()) ? 0.6 : 1,
                fontSize: 20, flexShrink: 0, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >↑</button>
          </div>
        </div>

        {/* Courses sidebar — كل كورس = محادثة مستمرة مستقلة بالباك اند */}
        <div style={{ width: 240, background: 'rgba(12,4,45,0.5)', borderRight: '1px solid rgba(255,255,255,0.07)', padding: '16px', overflowY: 'auto', direction: 'rtl' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>كورساتي</div>
          {courses.map(e => {
            const isSelected = e.course_id._id === selectedCourseId
            return (
              <div
                key={e._id}
                onClick={() => !sending && setSelectedCourseId(e.course_id._id)}
                style={{
                  padding: '9px 12px', borderRadius: 10, fontSize: 13, cursor: sending ? 'not-allowed' : 'pointer',
                  marginBottom: 4, transition: 'all 0.15s',
                  background: isSelected ? 'rgba(124,58,237,0.18)' : 'transparent',
                  border: `1px solid ${isSelected ? 'rgba(124,58,237,0.4)' : 'transparent'}`,
                  color: isSelected ? '#fff' : 'rgba(255,255,255,0.6)',
                  fontWeight: isSelected ? 700 : 400,
                }}
              >
                💬 {e.course_id.title}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}