import { useState, useRef, useEffect } from 'react'

const suggested = [
  'لخّص الدرس الأخير',
  'أنشئ اختباراً تجريبياً',
  'اشرح مفهوم الـ Hooks',
  'ما هي الواجبات المعلقة؟',
  'خطة مراجعة لنهاية الأسبوع',
]

type Message = { id: number; role: 'user' | 'assistant'; text: string; time: string }

const initialMessages: Message[] = [
  {
    id: 1, role: 'assistant',
    text: 'مرحباً يا أحمد! 👋 أنا مساعدك الذكي في Edujar. يمكنني مساعدتك في:\n• تلخيص الدروس والمحاضرات\n• إنشاء أسئلة تدريبية\n• شرح المفاهيم الصعبة\n• تتبع تقدمك الدراسي\n\nكيف يمكنني مساعدتك اليوم؟',
    time: '6:30م',
  },
]

const botResponses: Record<string, string> = {
  'لخّص الدرس الأخير': 'بالتأكيد! ملخص الدرس 11 "تحسين الأداء في React":\n\n**المفاهيم الرئيسية:**\n• **useMemo**: لحفظ نتائج العمليات الحسابية الثقيلة\n• **useCallback**: لحفظ مرجع الدوال ومنع إعادة الإنشاء\n• **React.memo**: لمنع إعادة تصيير المكونات دون تغيير\n\n**متى تستخدم كل منها؟**\n- useMemo → عندما تكون العملية الحسابية مُكلفة\n- useCallback → عندما تمرر دالة كـ prop\n- React.memo → عندما يُصيَّر المكون كثيراً دون حاجة\n\nهل تريد أسئلة تدريبية على هذا الدرس؟',
  'أنشئ اختباراً تجريبياً': 'حسناً! إليك اختباراً تجريبياً من 3 أسئلة:\n\n**السؤال 1:** ما الفرق بين useMemo وuseCallback؟\n→ useMemo يحفظ **قيمة**، useCallback يحفظ **دالة**\n\n**السؤال 2:** متى يجب استخدام React.memo؟\n→ عندما يتلقى المكون props ثابتة ولكنه يُعاد تصييره كثيراً\n\n**السؤال 3:** ما الخطأ في هذا الكود؟\n```jsx\nconst value = useMemo(computeHeavy);\n```\n→ يجب تمرير مصفوفة dependencies كمعامل ثاني\n\nكيف كان أداؤك؟ 🎯',
  'اشرح مفهوم الـ Hooks': 'الـ **Hooks** في React هي دوال خاصة تبدأ بـ `use` تتيح لك استخدام ميزات React في المكونات الوظيفية.\n\n**أشهر الـ Hooks:**\n\n🔵 **useState** — لإدارة الحالة المحلية\n```jsx\nconst [count, setCount] = useState(0);\n```\n\n🟢 **useEffect** — للتعامل مع العمليات الجانبية\n```jsx\nuseEffect(() => { fetchData(); }, []);\n```\n\n🟡 **useContext** — للوصول إلى Context\n\n🔴 **useRef** — للوصول لعناصر DOM\n\n**قواعد مهمة:**\n• استخدمها فقط في مكونات React\n• استخدمها على المستوى الأعلى فقط (لا داخل حلقات أو شروط)\n\nهل تريد أمثلة تطبيقية؟',
}

export default function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, typing])

  const sendMessage = (text: string) => {
    if (!text.trim()) return
    const userMsg: Message = { id: Date.now(), role: 'user', text, time: new Date().toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }) }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setTyping(true)

    setTimeout(() => {
      const response = botResponses[text] || `شكراً على سؤالك! "${text}"\n\nفهمت سؤالك بخصوص ${text.includes('React') ? 'React' : 'الموضوع'}. للإجابة بشكل أفضل، هل يمكنك تزويدي بمزيد من التفاصيل؟ يمكنني مساعدتك في:\n• تلخيص المحتوى الدراسي\n• شرح المفاهيم التقنية\n• إنشاء أسئلة تدريبية\n• تقديم خطة دراسية`
      const botMsg: Message = { id: Date.now() + 1, role: 'assistant', text: response, time: new Date().toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' }) }
      setMessages(prev => [...prev, botMsg])
      setTyping(false)
    }, 1400)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - var(--header-height))', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 28px', background: 'rgba(8,3,32,0.5)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 14, alignItems: 'center' }}>
        <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🤖</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>المساعد الذكي Edujar AI</div>
          <div style={{ fontSize: 12, color: '#10b981', display: 'flex', gap: 5, alignItems: 'center' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
            متاح الآن
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Chat */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {messages.map(m => (
              <div key={m.id} style={{ display: 'flex', gap: 12, flexDirection: m.role === 'user' ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: m.role === 'assistant' ? 'linear-gradient(135deg, #7c3aed, #a855f7)' : 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>
                  {m.role === 'assistant' ? '🤖' : 'أ'}
                </div>
                <div style={{ maxWidth: '72%' }}>
                  <div style={{
                    background: m.role === 'assistant' ? 'rgba(28,10,80,0.9)' : 'linear-gradient(135deg, rgba(124,58,237,0.4), rgba(168,85,247,0.3))',
                    border: `1px solid ${m.role === 'assistant' ? 'rgba(255,255,255,0.1)' : 'rgba(124,58,237,0.4)'}`,
                    borderRadius: m.role === 'assistant' ? '4px 16px 16px 16px' : '16px 4px 16px 16px',
                    padding: '12px 16px',
                  }}>
                    <pre style={{ margin: 0, fontFamily: 'inherit', fontSize: 14, lineHeight: 1.65, whiteSpace: 'pre-wrap', color: 'rgba(255,255,255,0.9)' }}>{m.text}</pre>
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 5, textAlign: m.role === 'user' ? 'right' : 'left', direction: 'ltr' }}>{m.time}</div>
                </div>
              </div>
            ))}

            {typing && (
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
                onClick={() => sendMessage(s)}
                style={{
                  whiteSpace: 'nowrap', padding: '7px 14px', borderRadius: 9999, fontSize: 12.5, fontWeight: 500,
                  background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)',
                  color: '#c4b5fd', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
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
              onKeyDown={e => e.key === 'Enter' && sendMessage(input)}
              placeholder="اكتب سؤالك هنا..."
              style={{ flex: 1, paddingTop: 12, paddingBottom: 12 }}
            />
            <button
              onClick={() => sendMessage(input)}
              style={{ width: 46, height: 46, borderRadius: '50%', background: 'linear-gradient(135deg, #7c3aed, #a855f7)', border: 'none', cursor: 'pointer', fontSize: 20, flexShrink: 0, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >↑</button>
          </div>
        </div>

        {/* History sidebar */}
        <div style={{ width: 240, background: 'rgba(12,4,45,0.5)', borderRight: '1px solid rgba(255,255,255,0.07)', padding: '16px', overflowY: 'auto', direction: 'rtl' }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>المحادثات السابقة</div>
          {['مراجعة React Hooks', 'شرح Redux Toolkit', 'اختبار Python', 'تلخيص الدرس 8'].map((h, i) => (
            <div key={i} style={{ padding: '9px 12px', borderRadius: 10, fontSize: 13, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', marginBottom: 4, transition: 'all 0.15s', border: '1px solid transparent' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(124,58,237,0.12)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(124,58,237,0.2)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.borderColor = 'transparent' }}
            >
              💬 {h}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
