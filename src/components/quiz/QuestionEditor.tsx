// src/components/quiz/QuestionEditor.tsx
import type { QuizQuestion } from '../../services/quizService'

interface Props {
    question: QuizQuestion
    index: number
    canRemove: boolean
    onChange: (next: QuizQuestion) => void
    onRemove: () => void
}

export function QuestionEditor({ question, index, canRemove, onChange, onRemove }: Props) {
    const setText = (text: string) => onChange({ ...question, text })

    const setType = (type: QuizQuestion['question_type']) => {
        if (type === 'true_false') {
            onChange({ ...question, question_type: type, choices: [{ text: 'صحيح', is_correct: true }, { text: 'خطأ', is_correct: false }] })
        } else if (question.question_type === 'true_false') {
            onChange({ ...question, question_type: type, choices: [{ text: '', is_correct: true }, { text: '', is_correct: false }] })
        } else {
            onChange({ ...question, question_type: type })
        }
    }

    const setChoiceText = (idx: number, text: string) => {
        onChange({ ...question, choices: question.choices.map((c, i) => (i === idx ? { ...c, text } : c)) })
    }

    const setCorrect = (idx: number) => {
        onChange({ ...question, choices: question.choices.map((c, i) => ({ ...c, is_correct: i === idx })) })
    }

    const addChoice = () => onChange({ ...question, choices: [...question.choices, { text: '', is_correct: false }] })

    const removeChoice = (idx: number) => {
        if (question.choices.length <= 2) return
        const removed = question.choices[idx]
        const remaining = question.choices.filter((_, i) => i !== idx)
        if (removed.is_correct && remaining.length > 0) remaining[0].is_correct = true
        onChange({ ...question, choices: remaining })
    }

    return (
        <div style={{ border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, padding: 16, background: 'rgba(255,255,255,0.03)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>السؤال #{index + 1}</span>
                {canRemove && (
                    <button type="button" onClick={onRemove} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 13 }}>✕ حذف</button>
                )}
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <input className="form-input" placeholder="نص السؤال" required value={question.text} onChange={e => setText(e.target.value)} style={{ flex: 1 }} />
                <select className="form-input" style={{ width: 150 }} value={question.question_type} onChange={e => setType(e.target.value as QuizQuestion['question_type'])}>
                    <option value="mcq">اختيار متعدد</option>
                    <option value="true_false">صح / خطأ</option>
                </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {question.choices.map((choice, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <button
                            type="button"
                            onClick={() => setCorrect(idx)}
                            style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${choice.is_correct ? '#10b981' : 'rgba(255,255,255,0.25)'}`, background: choice.is_correct ? '#10b981' : 'transparent', color: '#fff', fontSize: 11, cursor: 'pointer', flexShrink: 0 }}
                        >
                            {choice.is_correct ? '✓' : ''}
                        </button>
                        <input
                            className="form-input" placeholder={`الخيار ${idx + 1}`} required
                            disabled={question.question_type === 'true_false'}
                            value={choice.text} onChange={e => setChoiceText(idx, e.target.value)}
                            style={{ flex: 1 }}
                        />
                        {question.question_type === 'mcq' && question.choices.length > 2 && (
                            <button type="button" onClick={() => removeChoice(idx)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer' }}>✕</button>
                        )}
                    </div>
                ))}
                {question.question_type === 'mcq' && (
                    <button type="button" onClick={addChoice} className="btn-outline" style={{ alignSelf: 'flex-start', padding: '5px 14px', fontSize: 12.5, marginTop: 4 }}>+ إضافة خيار</button>
                )}
            </div>
        </div>
    )
}