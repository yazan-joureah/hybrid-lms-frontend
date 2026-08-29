// src/pages/instructor/course-builder/CourseInfoTab.tsx
import { useState, useEffect } from 'react'
import { useConfirmDialog } from '../../../hooks/useConfirmDialog'
import { ConfirmDialog } from '../../../components/common/ConfirmDialog'
import type { useCourseDetail } from '../../../hooks/course/useCourseDetail'
import { CourseInfoForm } from '../../../components/course/CourseInfoForm'
import { getCourseCoverUrl, PLACEHOLDER_IMAGE, handleImageFallback } from '../../../utils/imageUtils'
import type { CourseFormPayload } from '../../../services/courseService'
import type { Quiz } from '../../../services/quizService'

type CourseInfoTabProps = ReturnType<typeof useCourseDetail> & {
    finalExam?: Quiz
    quizzesLoading: boolean
    onDeleted: () => void
    onGoToQuizzesTab: () => void
}

export function CourseInfoTab({
    detail, loading, saving, coverUploading, updateCourse, deleteCourse, uploadCover, submitForReview, cancelReview,
    finalExam, quizzesLoading, onDeleted, onGoToQuizzesTab,
}: CourseInfoTabProps) {
    const { confirm, dialogProps } = useConfirmDialog()
    const [editMode, setEditMode] = useState(false)
    const [editForm, setEditForm] = useState<CourseFormPayload | null>(null)

    useEffect(() => {
        if (detail) {
            setEditForm({
                title: detail.title, description: detail.description, category: detail.category,
                course_type: detail.course_type, price: detail.price, is_synchronous: detail.is_synchronous,
                max_students: detail.max_students ?? null, completion_threshold: detail.completion_threshold ?? 0.7,
            })
        }
    }, [detail])

    if (loading || !detail || !editForm) {
        return <div style={{ padding: 30, color: 'rgba(255,255,255,0.4)' }}>جارٍ التحميل...</div>
    }

    const handleSave = async () => {
        const ok = await updateCourse(editForm)
        if (ok) setEditMode(false)
    }

    const handleDelete = async () => {
        const ok = await confirm('هل أنت متأكد من حذف هذا الكورس؟ لا يمكن التراجع عن هذا الإجراء.', { title: 'حذف الكورس', danger: true })
        if (!ok) return
        const ok2 = await deleteCourse()
        if (ok2) onDeleted()
    }

    const canSubmitReview = Boolean(finalExam && finalExam.status === 'published')
    const showExamGateBanner = !quizzesLoading && (detail.status === 'draft' || detail.status === 'rejected') && !canSubmitReview

    return (
        <div>
            {dialogProps && <ConfirmDialog {...dialogProps} />}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
                <div style={{ display: 'flex', gap: 10 }}>
                    {(detail.status === 'draft' || detail.status === 'rejected') && (
                        <button
                            className="btn-primary" style={{ padding: '8px 18px', fontSize: 13.5 }}
                            disabled={!canSubmitReview || quizzesLoading}
                            title={!canSubmitReview ? 'يجب إنشاء امتحان نهائي ونشره أولاً' : undefined}
                            onClick={submitForReview}
                        >
                            إرسال للمراجعة
                        </button>
                    )}
                    {detail.status === 'pending_review' && (
                        <button className="btn-outline" style={{ padding: '8px 18px', fontSize: 13.5 }} onClick={cancelReview}>إلغاء طلب المراجعة</button>
                    )}
                </div>
                {!editMode ? (
                    <button className="btn-outline" style={{ padding: '8px 18px', fontSize: 13.5 }} onClick={() => setEditMode(true)}>✎ تعديل</button>
                ) : (
                    <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn-primary" style={{ padding: '8px 18px', fontSize: 13.5 }} disabled={saving} onClick={handleSave}>
                            {saving ? 'جارٍ الحفظ...' : 'حفظ'}
                        </button>
                        <button className="btn-outline" style={{ padding: '8px 18px', fontSize: 13.5 }} onClick={() => setEditMode(false)}>إلغاء</button>
                    </div>
                )}
            </div>

            {showExamGateBanner && (
                <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, padding: '13px 16px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                    <span style={{ fontSize: 13, color: '#fbbf24' }}>
                        ⚠️ {finalExam ? 'يوجد لديك امتحان نهائي كمسودة — يجب نشره' : 'يجب إنشاء امتحان نهائي واحد ونشره'} قبل إرسال الكورس للمراجعة.
                    </span>
                    <button className="btn-outline" style={{ padding: '6px 16px', fontSize: 12.5, flexShrink: 0 }} onClick={onGoToQuizzesTab}>
                        الانتقال إلى تبويب الاختبارات →
                    </button>
                </div>
            )}

            {detail.rejection_reason && detail.status !== 'published' && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 20, fontSize: 13.5 }}>
                    <strong style={{ color: '#f87171' }}>ملاحظات الإدارة:</strong> {detail.rejection_reason}
                </div>
            )}

            {editMode ? (
                <>
                    <CourseInfoForm value={editForm} onChange={setEditForm} />
                    <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.4)', marginTop: 10 }}>
                        ملاحظة: نوع الالتقاء (مباشر/ذاتي) لا يمكن تغييره بعد إنشاء الكورس.
                    </div>
                </>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
                    <div><strong>العنوان:</strong> {detail.title}</div>
                    <div><strong>الوصف:</strong> {detail.description}</div>
                    <div><strong>التصنيف:</strong> {detail.category}</div>
                    <div><strong>النوع:</strong> {detail.course_type === 'free' ? 'مجاني' : `مدفوع — ${detail.price} ر.س`}</div>
                    <div><strong>طريقة الالتقاء:</strong> {detail.is_synchronous ? 'مباشر (Synchronous)' : 'ذاتي التوقيت (Asynchronous)'}</div>
                    {detail.max_students && <div><strong>الحد الأقصى للطلاب:</strong> {detail.max_students}</div>}
                    <div><strong>نسبة الإكمال المطلوبة:</strong> {(detail.completion_threshold ?? 0.7) * 100}%</div>
                </div>
            )}

            <div style={{ marginTop: 28 }}>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10 }}>صورة الغلاف</div>
                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <img
                        src={getCourseCoverUrl(detail._id) || PLACEHOLDER_IMAGE}
                        alt="غلاف الكورس"
                        style={{ width: 140, height: 90, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--border)' }}
                        onError={handleImageFallback}
                    />
                    <label className="btn-outline" style={{ padding: '9px 18px', fontSize: 13.5, cursor: coverUploading ? 'not-allowed' : 'pointer' }}>
                        {coverUploading ? 'جارٍ الرفع...' : '📤 تغيير الصورة'}
                        <input
                            type="file" accept="image/*" style={{ display: 'none' }} disabled={coverUploading}
                            onChange={e => { const f = e.target.files?.[0]; if (f) uploadCover(f); e.target.value = '' }}
                        />
                    </label>
                </div>
            </div>

            {(detail.status === 'draft' || detail.status === 'rejected') && (
                <div style={{ marginTop: 28, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                    <button
                        onClick={handleDelete}
                        style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 9999, padding: '9px 20px', color: '#f87171', fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit' }}
                    >
                        🗑 حذف الكورس
                    </button>
                </div>
            )}
        </div>
    )
}