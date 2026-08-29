// src/components/quiz/QuizListItem.tsx
import type { Quiz } from '../../services/quizService'

interface Props {
    quiz: Quiz
    onEdit: () => void
    onDelete: () => void
    onPublish: () => void
}

export function QuizListItem({ quiz, onEdit, onDelete, onPublish }: Props) {
    return (
        <div style={{ border: '1px solid var(--border)', borderRadius: 14, padding: '16px 18px', background: 'rgba(255,255,255,0.02)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                        <span style={{ fontSize: 15, fontWeight: 700 }}>{quiz.title}</span>
                        <span className="badge" style={{ background: quiz.quiz_type === 'exam' ? 'rgba(239,68,68,0.15)' : 'rgba(6,182,212,0.15)', color: quiz.quiz_type === 'exam' ? '#f87171' : '#22d3ee', fontSize: 10.5, textTransform: 'uppercase' }}>
                            {quiz.quiz_type === 'exam' ? 'امتحان نهائي' : 'اختبار وحدة'}
                        </span>
                        <span className="badge" style={{ background: quiz.status === 'published' ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.15)', color: quiz.status === 'published' ? '#34d399' : '#94a3b8', fontSize: 10.5 }}>
                            {quiz.status === 'published' ? 'منشور' : 'مسودة'}
                        </span>
                        {quiz.locked && <span className="badge" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', fontSize: 10.5 }}>🔒 مقفل</span>}
                    </div>
                    <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.5)' }}>
                        ⏱ {quiz.duration_minutes} دقيقة | 🎯 نجاح: {quiz.passing_score_percent}% | 🔁 محاولات: {quiz.max_attempts} | ❓ {quiz.questions.length} سؤال
                    </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    {quiz.status === 'draft' && (
                        <button className="btn-primary" style={{ padding: '7px 16px', fontSize: 12.5 }} onClick={onPublish}>نشر</button>
                    )}
                    {!quiz.locked && (
                        <>
                            <button className="btn-outline" style={{ padding: '7px 16px', fontSize: 12.5 }} onClick={onEdit}>✎ تعديل</button>
                            <button onClick={onDelete} style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '7px 14px', color: '#f87171', fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}>🗑</button>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}