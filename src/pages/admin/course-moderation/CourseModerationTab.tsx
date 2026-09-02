// src/pages/admin/course-moderation/CourseModerationTab.tsx
import { useState } from 'react'
import { useCourseModeration } from '../../../hooks/admin/useCourseModeration'
import { PendingCourseList } from './PendingCourseList'
import { CourseReviewPanel } from './CourseReviewPanel'

const STATUS_FILTER_OPTIONS = [
    { value: '', label: 'كل الحالات' },
    { value: 'draft', label: 'مسودة' },
    { value: 'pending_review', label: 'قيد المراجعة' },
    { value: 'published', label: 'منشور' },
    { value: 'rejected', label: 'مرفوض' },
    { value: 'suspended', label: 'موقوف' },
    { value: 'archived', label: 'مؤرشف' },
]

export function CourseModerationTab() {
    const { view, setView, statusFilter, setStatusFilter, courses, loading, submitReview, moderateStatus } = useCourseModeration()
    const [selectedId, setSelectedId] = useState<string | null>(null)

    const selectedCourse = courses.find(c => c._id === selectedId) || null

    if (selectedCourse) {
        return (
            <CourseReviewPanel
                course={selectedCourse}
                onClose={() => setSelectedId(null)}
                onSubmitReview={(decision, reason) => submitReview(selectedCourse._id, decision, reason)}
                onModerateStatus={status => moderateStatus(selectedCourse._id, status)}
            />
        )
    }

    return (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: 24 }}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
                <div className="tab-bar" style={{ display: 'inline-flex' }}>
                    <div className={`tab-item${view === 'pending' ? ' active' : ''}`} onClick={() => { setView('pending'); setSelectedId(null) }}>
                        قيد المراجعة
                    </div>
                    <div className={`tab-item${view === 'all' ? ' active' : ''}`} onClick={() => { setView('all'); setSelectedId(null) }}>
                        كل الكورسات
                    </div>
                </div>
                {view === 'all' && (
                    <select
                        className="form-input"
                        style={{ width: 200, marginRight: 'auto' }}
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        {STATUS_FILTER_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>
                )}
            </div>

            <h3 style={{ marginBottom: 16 }}>{view === 'pending' ? 'كورسات بانتظار المراجعة' : 'كل الكورسات'}</h3>
            {loading ? (
                <div style={{ color: 'rgba(255,255,255,0.5)' }}>...جارٍ التحميل</div>
            ) : (
                <PendingCourseList courses={courses} onSelect={setSelectedId} showStatus={view === 'all'} />
            )}
        </div>
    )
}