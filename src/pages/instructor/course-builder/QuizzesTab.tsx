// src/pages/instructor/course-builder/QuizzesTab.tsx
import { useState } from 'react'
import type { CourseUnit } from '../../../services/courseService'
import type { useInstructorQuizzes } from '../../../hooks/quiz/useInstructorQuizzes'
import type { Quiz, QuizFormPayload } from '../../../services/quizService'
import { QuizListItem } from '../../../components/quiz/QuizListItem'
import { QuizFormModal } from '../../../components/quiz/QuizFormModal'
import { SkeletonLoader } from '../../../components/common/Loading'

type QuizzesTabProps = ReturnType<typeof useInstructorQuizzes> & {
    units: CourseUnit[]
    isSynchronous: boolean
}

export function QuizzesTab({ quizzes, loading, finalExam, units, isSynchronous, createQuiz, updateQuiz, deleteQuiz, publishQuiz }: QuizzesTabProps) {
    const [modalOpen, setModalOpen] = useState(false)
    const [editingQuiz, setEditingQuiz] = useState<Quiz | null>(null)

    const openCreate = () => { setEditingQuiz(null); setModalOpen(true) }
    const openEdit = (quiz: Quiz) => { setEditingQuiz(quiz); setModalOpen(true) }

    const handleSubmit = (form: QuizFormPayload) => (editingQuiz ? updateQuiz(editingQuiz._id, form) : createQuiz(form))

    if (loading) return <SkeletonLoader type="row" count={2} />

    return (
        <div>
            {!finalExam && (
                <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 18, fontSize: 13, color: '#fbbf24' }}>
                    ⚠️ لا يمكن إرسال هذا الكورس للمراجعة حتى تنشئ امتحاناً نهائياً واحداً وتنشره.
                </div>
            )}
            {finalExam && finalExam.status !== 'published' && (
                <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 18, fontSize: 13, color: '#fbbf24' }}>
                    ⚠️ لديك امتحان نهائي كمسودة — يجب نشره قبل إرسال الكورس للمراجعة.
                </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <button className="btn-primary" style={{ padding: '9px 20px', fontSize: 13.5 }} onClick={openCreate}>+ اختبار / امتحان جديد</button>
            </div>

            {quizzes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: 40, color: 'rgba(255,255,255,0.35)', fontSize: 13.5 }}>لا توجد اختبارات بعد.</div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {quizzes.map(q => (
                        <QuizListItem key={q._id} quiz={q} onEdit={() => openEdit(q)} onDelete={() => deleteQuiz(q)} onPublish={() => publishQuiz(q._id)} />
                    ))}
                </div>
            )}

            {modalOpen && (
                <QuizFormModal
                    editingQuiz={editingQuiz}
                    units={units}
                    hasExistingExam={Boolean(finalExam && finalExam._id !== editingQuiz?._id)}
                    isSynchronous={isSynchronous}
                    onSubmit={handleSubmit}
                    onClose={() => setModalOpen(false)}
                />
            )}
        </div>
    )
}