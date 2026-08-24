// src/pages/admin/course-moderation/CourseModerationTab.tsx
import { useState } from 'react'
import { useCourseModeration } from '../../../hooks/admin/useCourseModeration'
import { PendingCourseList } from './PendingCourseList'
import { CourseReviewPanel } from './CourseReviewPanel'

export function CourseModerationTab() {
    const { courses, loading, submitReview, moderateStatus } = useCourseModeration()
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
            <h3 style={{ marginBottom: 16 }}>كورسات بانتظار المراجعة</h3>
            {loading ? (
                <div style={{ color: 'rgba(255,255,255,0.5)' }}>...جارٍ التحميل</div>
            ) : (
                <PendingCourseList courses={courses} onSelect={setSelectedId} />
            )}
        </div>
    )
}