// src/components/quiz/QuizFormModal.tsx
import { useState, type FormEvent } from 'react'
import { ModalPortal } from '../common/ModalPortal'
import type { CourseUnit } from '../../services/courseService'
import type { Quiz, QuizFormPayload, QuizQuestion } from '../../services/quizService'
import { QuestionEditor } from './QuestionEditor'

function emptyQuestion(): QuizQuestion {
    return { question_type: 'mcq', text: '', choices: [{ text: '', is_correct: true }, { text: '', is_correct: false }] }
}

function toDateTimeLocal(iso?: string) {
    if (!iso) return ''
    const d = new Date(iso)
    if (isNaN(d.getTime())) return ''
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function buildInitialForm(quiz: Quiz | null, defaultUnitId: string): QuizFormPayload {
    if (!quiz) {
        return {
            title: '', description: '', quiz_type: 'quiz', unit_id: defaultUnitId,
            start_time: '', end_time: '', duration_minutes: 30, passing_score_percent: 60,
            max_attempts: 1, allow_back_navigation: true, questions: [emptyQuestion()],
        }
    }
    return {
        title: quiz.title, description: quiz.description || '', quiz_type: quiz.quiz_type,
        unit_id: quiz.unit_id || defaultUnitId,
        start_time: toDateTimeLocal(quiz.start_time), end_time: toDateTimeLocal(quiz.end_time),
        duration_minutes: quiz.duration_minutes, passing_score_percent: quiz.passing_score_percent,
        max_attempts: quiz.max_attempts, allow_back_navigation: quiz.allow_back_navigation,
        questions: quiz.questions.length ? quiz.questions : [emptyQuestion()],
    }
}

interface Props {
    editingQuiz: Quiz | null
    units: CourseUnit[]
    hasExistingExam: boolean
    isSynchronous: boolean
    onSubmit: (form: QuizFormPayload) => Promise<boolean | void>
    onClose: () => void
}

export function QuizFormModal({ editingQuiz, units, hasExistingExam, isSynchronous, onSubmit, onClose }: Props) {
    const [form, setForm] = useState<QuizFormPayload>(() => buildInitialForm(editingQuiz, units[0]?._id || ''))
    const [submitting, setSubmitting] = useState(false)
    const [validationError, setValidationError] = useState('')

    const set = <K extends keyof QuizFormPayload>(key: K, value: QuizFormPayload[K]) => setForm(prev => ({ ...prev, [key]: value }))

    const updateQuestion = (index: number, next: QuizQuestion) => {
        setForm(prev => ({ ...prev, questions: prev.questions.map((q, i) => (i === index ? next : q)) }))
    }
    const addQuestion = () => setForm(prev => ({ ...prev, questions: [...prev.questions, emptyQuestion()] }))
    const removeQuestion = (index: number) => setForm(prev => ({ ...prev, questions: prev.questions.filter((_, i) => i !== index) }))

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setValidationError('')

        if (form.quiz_type === 'quiz' && !form.unit_id) {
            setValidationError('الرجاء اختيار وحدة لهذا الاختبار.')
            return
        }
        if (form.quiz_type === 'exam' && isSynchronous && (!form.start_time || !form.end_time)) {
            setValidationError('الامتحان النهائي بكورس متزامن يجب أن يكون له وقت بداية ونهاية محددين.')
            return
        }
        for (const q of form.questions) {
            if (!q.text.trim()) { setValidationError('كل سؤال يحتاج نصاً.'); return }
            if (q.choices.some(c => !c.text.trim())) { setValidationError('كل خيار يحتاج نصاً.'); return }
            if (!q.choices.some(c => c.is_correct)) { setValidationError('كل سؤال يحتاج إجابة صحيحة واحدة محددة.'); return }
        }


        setSubmitting(true)
        const ok = await onSubmit(form)
        setSubmitting(false)
        if (ok !== false) onClose()
    }

    const examDisabled = form.quiz_type !== 'exam' && hasExistingExam

    return (
        <ModalPortal>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, backdropFilter: 'blur(4px)' }}>
                <div style={{ background: 'rgba(12,4,45,0.98)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 20, width: '100%', maxWidth: 720, maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: 17, fontWeight: 800, margin: 0 }}>{editingQuiz ? 'تعديل الاختبار' : 'إنشاء اختبار / امتحان جديد'}</h3>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 18, cursor: 'pointer' }}>✕</button>
                    </div>

                    <form id="quiz-form" onSubmit={handleSubmit} style={{ padding: 24, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div>
                                <label className="form-label">نوع الاختبار</label>
                                <select className="form-input" value={form.quiz_type} onChange={e => set('quiz_type', e.target.value as 'quiz' | 'exam')}>
                                    <option value="quiz">اختبار وحدة (quiz)</option>
                                    <option value="exam" disabled={examDisabled}>امتحان نهائي (exam){examDisabled ? ' — موجود بالفعل' : ''}</option>
                                </select>
                            </div>
                            {form.quiz_type === 'quiz' && (
                                <div>
                                    <label className="form-label">الوحدة المرتبطة</label>
                                    <select className="form-input" value={form.unit_id} onChange={e => set('unit_id', e.target.value)} required>
                                        <option value="">اختر وحدة</option>
                                        {units.map(u => <option key={u._id} value={u._id}>{u.title}</option>)}
                                    </select>
                                </div>
                            )}
                        </div>

                        {form.quiz_type === 'exam' && isSynchronous && (
                            <div style={{ fontSize: 12.5, color: '#fbbf24', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, padding: '8px 12px' }}>
                                هذا كورس متزامن — الامتحان النهائي يجب أن يكون له وقت بداية ونهاية محددين.
                            </div>
                        )}

                        <div>
                            <label className="form-label">عنوان الاختبار</label>
                            <input className="form-input" required maxLength={200} value={form.title} onChange={e => set('title', e.target.value)} />
                        </div>
                        <div>
                            <label className="form-label">الوصف (اختياري)</label>
                            <textarea className="form-input" rows={2} value={form.description} onChange={e => set('description', e.target.value)} style={{ resize: 'none' }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                            <div>
                                <label className="form-label">وقت البداية (اختياري)</label>
                                <input className="form-input" type="datetime-local" required={form.quiz_type === 'exam' && isSynchronous} value={form.start_time} onChange={e => set('start_time', e.target.value)} />
                            </div>
                            <div>
                                <label className="form-label">وقت النهاية (اختياري)</label>
                                <input className="form-input" type="datetime-local" required={form.quiz_type === 'exam' && isSynchronous} value={form.end_time} onChange={e => set('end_time', e.target.value)} />
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
                            <div>
                                <label className="form-label">المدة (دقائق)</label>
                                <input className="form-input" type="number" min={1} required value={form.duration_minutes} onChange={e => set('duration_minutes', Number(e.target.value))} />
                            </div>
                            <div>
                                <label className="form-label">درجة النجاح (%)</label>
                                <input className="form-input" type="number" min={0} max={100} required value={form.passing_score_percent} onChange={e => set('passing_score_percent', Number(e.target.value))} />
                            </div>
                            <div>
                                <label className="form-label">عدد المحاولات</label>
                                <input className="form-input" type="number" min={1} required value={form.max_attempts} onChange={e => set('max_attempts', Number(e.target.value))} />
                            </div>
                        </div>

                        <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13.5, cursor: 'pointer' }}>
                            <input type="checkbox" checked={form.allow_back_navigation} onChange={e => set('allow_back_navigation', e.target.checked)} />
                            السماح للطلاب بالتنقل للأسئلة السابقة
                        </label>

                        <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <span style={{ fontSize: 14.5, fontWeight: 700 }}>الأسئلة ({form.questions.length})</span>
                            {form.questions.map((q, idx) => (
                                <QuestionEditor
                                    key={idx}
                                    question={q}
                                    index={idx}
                                    canRemove={form.questions.length > 1}
                                    onChange={next => updateQuestion(idx, next)}
                                    onRemove={() => removeQuestion(idx)}
                                />
                            ))}
                            <button type="button" onClick={addQuestion} className="btn-outline" style={{ alignSelf: 'flex-start', padding: '8px 18px', fontSize: 13 }}>+ إضافة سؤال آخر</button>
                        </div>

                        {validationError && (
                            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#f87171' }}>
                                {validationError}
                            </div>
                        )}
                    </form>

                    <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
                        <button type="button" className="btn-outline" style={{ padding: '9px 20px', fontSize: 13.5 }} onClick={onClose}>إلغاء</button>
                        <button type="submit" form="quiz-form" className="btn-primary" style={{ padding: '9px 24px', fontSize: 13.5 }} disabled={submitting}>
                            {submitting ? 'جارٍ الحفظ...' : editingQuiz ? 'حفظ التعديلات' : 'إنشاء (كمسودة)'}
                        </button>
                    </div>
                </div>
            </div>
        </ModalPortal>
    )
}