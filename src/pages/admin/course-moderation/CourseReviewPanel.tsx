// src/pages/admin/course-moderation/CourseReviewPanel.tsx
import { useState } from 'react'
import type { PendingCourseSummary, CourseReviewDecision, CourseModerationStatus } from '../../../services/courseService'
import { CourseContentPreviewModal } from '../../../components/course/CourseContentPreviewModal'

interface Props {
    course: PendingCourseSummary
    onClose: () => void
    onSubmitReview: (decision: CourseReviewDecision, reason?: string) => Promise<boolean>
    onModerateStatus: (status: CourseModerationStatus) => Promise<boolean>
}

const STATUS_LABELS: Record<string, string> = {
    draft: 'مسودة', pending_review: 'قيد المراجعة', published: 'منشور',
    rejected: 'مرفوض', suspended: 'موقوف', archived: 'مؤرشف',
}

export function CourseReviewPanel({ course, onClose, onSubmitReview, onModerateStatus }: Props) {
    const [previewOpen, setPreviewOpen] = useState(false)
    const [decision, setDecision] = useState<CourseReviewDecision>('publish')
    const [reason, setReason] = useState('')
    const [validationError, setValidationError] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [moderating, setModerating] = useState<CourseModerationStatus | null>(null)

    const isPendingReview = course.status === 'pending_review'
    const isPublished = course.status === 'published'
    const isSuspended = course.status === 'suspended'
    const isArchived = course.status === 'archived'

    const handleSubmit = async () => {
        if (decision !== 'publish' && !reason.trim()) {
            setValidationError('أدخل سبب الرفض/طلب التعديل.')
            return
        }
        setValidationError('')
        setSubmitting(true)
        const ok = await onSubmitReview(decision, reason.trim() || undefined)
        setSubmitting(false)
        if (ok) onClose()
    }

    const handleModerate = async (status: CourseModerationStatus) => {
        const label = status === 'suspended' ? 'تعليق' : status === 'archived' ? 'أرشفة' : 'إعادة تفعيل ونشر'
        if (!window.confirm(`هل أنت متأكد من ${label} هذا الكورس؟`)) return
        setModerating(status)
        const ok = await onModerateStatus(status)
        setModerating(null)
        if (ok) onClose()
    }

    return (
        <div style={{ background: 'var(--bg-card)', border: '2px solid #7c3aed', borderRadius: 18, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
                <h3>مراجعة: {course.title}</h3>
                <button className="btn-secondary" onClick={onClose}>إلغاء</button>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 10, marginBottom: 20, fontSize: 13.5 }}>
                <p><strong>الوصف:</strong> {course.description}</p>
                <p><strong>الفئة:</strong> {course.category}</p>
                <p><strong>النوع:</strong> {course.course_type}</p>
                <p><strong>مباشر:</strong> {course.is_synchronous ? 'نعم' : 'لا'}</p>
                <p><strong>الحالة:</strong> <span className="badge">{STATUS_LABELS[course.status] || course.status}</span></p>
            </div>

            <button className="btn-primary" style={{ marginBottom: 24 }} onClick={() => setPreviewOpen(true)}>
                👁 معاينة المحتوى الكامل (الوحدات + الاختبارات)
            </button>

            {isPendingReview && (
                <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
                    <div className="field-group" style={{ marginBottom: 14 }}>
                        <label className="form-label">القرار</label>
                        <select className="form-input" value={decision} onChange={e => setDecision(e.target.value as CourseReviewDecision)}>
                            <option value="publish">نشر الكورس</option>
                            <option value="needs_revision">يحتاج تعديل</option>
                            <option value="reject">رفض الكورس</option>
                        </select>
                    </div>
                    {decision !== 'publish' && (
                        <div className="field-group" style={{ marginBottom: 14 }}>
                            <label className="form-label">سبب الرفض / التعديل</label>
                            <textarea className="form-input" rows={3} value={reason} onChange={e => setReason(e.target.value)} placeholder="اشرح ما يجب تعديله..." />
                        </div>
                    )}
                    {validationError && <div style={{ color: '#f87171', fontSize: 13, marginBottom: 12 }}>⚠️ {validationError}</div>}
                    <button className="btn-primary" onClick={handleSubmit} disabled={submitting}>
                        {submitting ? '...' : 'تأكيد القرار النهائي'}
                    </button>
                </div>
            )}

            {(isPublished || isSuspended) && (
                <>
                    <hr style={{ margin: '20px 0', borderColor: 'rgba(255,255,255,0.08)' }} />
                    <h4 style={{ marginBottom: 12 }}>إجراءات الإدارة</h4>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        {isPublished && (
                            <button
                                className="btn-secondary"
                                style={{ background: '#f59e0b', color: '#fff', border: 'none' }}
                                disabled={moderating !== null}
                                onClick={() => handleModerate('suspended')}
                            >
                                {moderating === 'suspended' ? '...' : '⏸ تعليق فوري'}
                            </button>
                        )}
                        {isSuspended && (
                            <button
                                className="btn-secondary"
                                style={{ background: '#16a34a', color: '#fff', border: 'none' }}
                                disabled={moderating !== null}
                                onClick={() => handleModerate('published')}
                            >
                                {moderating === 'published' ? '...' : '♻️ إعادة تفعيل ونشر'}
                            </button>
                        )}
                        <button
                            className="btn-secondary"
                            style={{ background: '#dc2626', color: '#fff', border: 'none' }}
                            disabled={moderating !== null}
                            onClick={() => handleModerate('archived')}
                        >
                            {moderating === 'archived' ? '...' : '🗄 أرشفة فورية'}
                        </button>
                    </div>
                </>
            )}

            {isArchived && (
                <div style={{ marginTop: 20, background: 'rgba(100,116,139,0.1)', border: '1px solid rgba(100,116,139,0.3)', borderRadius: 10, padding: 14, fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                    🗄 هذا الكورس مؤرشف بشكل نهائي — لا يمكن تغيير حالته أو تعديله بعد الآن.
                </div>
            )}

            {previewOpen && (
                <CourseContentPreviewModal courseId={course._id} viewerRole="admin" onClose={() => setPreviewOpen(false)} />
            )}
        </div>
    )
}