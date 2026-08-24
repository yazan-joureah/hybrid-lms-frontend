// src/pages/admin/course-moderation/PendingCourseList.tsx
import type { PendingCourseSummary } from '../../../services/courseService'

interface Props {
    courses: PendingCourseSummary[]
    onSelect: (courseId: string) => void
}

export function PendingCourseList({ courses, onSelect }: Props) {
    if (courses.length === 0) {
        return <p style={{ color: 'rgba(255,255,255,0.5)' }}>لا توجد كورسات بانتظار المراجعة حاليًا.</p>
    }

    return (
        <table className="data-table" style={{ width: '100%' }}>
            <thead>
                <tr><th>عنوان الكورس</th><th>المدرّس</th><th>تاريخ التحديث</th><th></th></tr>
            </thead>
            <tbody>
                {courses.map(c => (
                    <tr key={c._id}>
                        <td>{c.title}</td>
                        <td>{typeof c.instructor_id === 'object' ? c.instructor_id?.full_name : c.instructor_id}</td>
                        <td style={{ color: 'rgba(255,255,255,0.5)' }}>{new Date(c.updatedAt).toLocaleDateString('ar')}</td>
                        <td><button className="btn-primary" onClick={() => onSelect(c._id)}>معاينة ومراجعة</button></td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}