// src/components/quiz/QuizPlayer.tsx
import { useStudentQuizEngine } from '../../hooks/quiz/useStudentQuizEngine'
import type { StudentQuizSummary } from '../../services/quizService'

interface Props {
    quiz: StudentQuizSummary
    onCompleted?: () => void
}

const pad = (n: number) => String(n).padStart(2, '0')

export function QuizPlayer({ quiz, onCompleted }: Props) {
    const engine = useStudentQuizEngine(quiz, onCompleted)

    if (engine.state === 'checking') {
        return <div style={{ padding: 60, textAlign: 'center', color: 'rgba(255,255,255,0.4)' }}>جارٍ التحقق من حالة الاختبار...</div>
    }

    if (engine.state === 'intro') {
        return (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: 32, textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
                <span className="badge" style={quiz.quiz_type === 'exam' ? { background: 'rgba(239,68,68,0.15)', color: '#f87171' } : { background: 'rgba(124,58,237,0.15)', color: '#c4b5fd' }}>
                    {quiz.quiz_type === 'exam' ? '🚨 امتحان نهائي' : '🎯 اختبار تدريبي'}
                </span>
                <h2 style={{ fontSize: 22, fontWeight: 800, margin: '16px 0 8px' }}>{quiz.title}</h2>
                {quiz.description && <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13.5, marginBottom: 20 }}>{quiz.description}</p>}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14 }}>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>المدة</div>
                        <div style={{ fontSize: 17, fontWeight: 700 }}>{quiz.duration_minutes} دقيقة</div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: 14 }}>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>درجة النجاح</div>
                        <div style={{ fontSize: 17, fontWeight: 700 }}>{quiz.passing_score_percent}%</div>
                    </div>
                </div>
                <button className="btn-primary" style={{ padding: '12px 32px', fontSize: 14.5 }} disabled={engine.starting} onClick={engine.startQuiz}>
                    {engine.starting ? 'جارٍ البدء...' : 'ابدأ الاختبار الآن ←'}
                </button>
            </div>
        )
    }

    if (engine.state === 'in_progress' && engine.attempt) {
        const questions = engine.attempt.quiz.questions
        const question = questions[engine.currentIndex]
        return (
            <div>
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '12px 18px', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600 }}>السؤال {engine.currentIndex + 1} من {questions.length}</span>
                    <span style={{ fontWeight: 800, fontVariantNumeric: 'tabular-nums', color: engine.timeRemaining < 60 ? '#f87171' : '#fff' }}>
                        ⏱ {pad(Math.floor(engine.timeRemaining / 60))}:{pad(engine.timeRemaining % 60)}
                    </span>
                    <span style={{ fontSize: 12, color: engine.autoSaveStatus === 'error' ? '#f87171' : 'rgba(255,255,255,0.4)' }}>
                        {engine.autoSaveStatus === 'saving' ? 'جارٍ الحفظ...' : engine.autoSaveStatus === 'error' ? '⚠️ غير متصل' : '✓ محفوظ'}
                    </span>
                </div>

                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: 26 }}>
                    <h3 style={{ fontSize: 16.5, fontWeight: 700, marginBottom: 20 }}>{question.text}</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                        {question.choices.map(choice => {
                            const selected = engine.answers[question._id] === choice._id
                            return (
                                <button
                                    key={choice._id}
                                    onClick={() => engine.selectChoice(question._id, choice._id)}
                                    style={{
                                        textAlign: 'right', padding: '13px 16px', borderRadius: 12, border: `1.5px solid ${selected ? '#7c3aed' : 'rgba(255,255,255,0.1)'}`,
                                        background: selected ? 'rgba(124,58,237,0.18)' : 'rgba(255,255,255,0.03)', color: '#fff', fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                                    }}
                                >
                                    {choice.text}
                                </button>
                            )
                        })}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn-outline" style={{ padding: '9px 18px', fontSize: 13.5 }} disabled={engine.currentIndex === 0} onClick={() => engine.goToQuestion(engine.currentIndex - 1)}>← السابق</button>
                            <button className="btn-outline" style={{ padding: '9px 18px', fontSize: 13.5 }} disabled={engine.currentIndex === questions.length - 1} onClick={() => engine.goToQuestion(engine.currentIndex + 1)}>التالي →</button>
                        </div>
                        <button className="btn-primary" style={{ padding: '9px 22px', fontSize: 13.5 }} disabled={engine.submitting} onClick={() => engine.submitQuiz(false)}>
                            {engine.submitting ? 'جارٍ الإرسال...' : 'إنهاء وإرسال الاختبار'}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (engine.state === 'result' && engine.result) {
        return (
            <div style={{ background: 'var(--bg-card)', border: `1px solid ${engine.result.passed ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 18, padding: 32, textAlign: 'center', maxWidth: 480, margin: '0 auto' }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>{engine.result.passed ? '🎉' : '📚'}</div>
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 6, color: engine.result.passed ? '#34d399' : '#f87171' }}>
                    {engine.result.passed ? 'اجتزت الاختبار بنجاح' : 'لم تجتز الاختبار هذه المرة'}
                </h3>
                <div style={{ fontSize: 42, fontWeight: 800, margin: '16px 0' }}>{engine.result.percentage}%</div>
                <div style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>
                    {engine.result.score} / {engine.result.total_possible}
                </div>
                <button className="btn-secondary" style={{ padding: '9px 22px', fontSize: 13.5 }} onClick={engine.restart}>عرض معلومات الاختبار</button>
            </div>
        )
    }

    return null
}