// src/pages/admin/course-moderation/PendingCourseList.tsx
import type { PendingCourseSummary } from '../../../services/courseService'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    draft: { label: 'مسودة', color: '#94a3b8' },
    pending_review: { label: 'قيد المراجعة', color: '#f59e0b' },
    published: { label: 'منشور', color: '#10b981' },
    rejected: { label: 'مرفوض', color: '#ef4444' },
    suspended: { label: 'موقوف', color: '#f59e0b' },
    archived: { label: 'مؤرشف', color: '#64748b' },
}

interface Props {
    courses: PendingCourseSummary[]
    onSelect: (courseId: string) => void
    showStatus?: boolean
}

export function PendingCourseList({ courses, onSelect, showStatus }: Props) {
    if (courses.length === 0) {
        return (
            <p style={{ color: 'rgba(255,255,255,0.5)' }}>
                {showStatus ? 'لا توجد كورسات تطابق الفلتر الحالي.' : 'لا توجد كورسات بانتظار المراجعة حاليًا.'}
            </p>
        )
    }

    return (
        <div className="table-responsive">
            <table className="data-table" style={{ width: '100%' }}>
                <thead>
                    <tr>
                        <th>عنوان الكورس</th>
                        <th>المدرّس</th>
                        {showStatus && <th>الحالة</th>}
                        <th>تاريخ التحديث</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {courses.map(c => {
                        const statusMeta = STATUS_LABELS[c.status] || { label: c.status, color: '#94a3b8' }
                        return (
                            <tr key={c._id}>
                                <td>{c.title}</td>
                                <td>{typeof c.instructor_id === 'object' ? c.instructor_id?.full_name : c.instructor_id}</td>
                                {showStatus && (
                                    <td>
                                        <span className="badge" style={{ background: `${statusMeta.color}22`, color: statusMeta.color, border: `1px solid ${statusMeta.color}44` }}>
                                            {statusMeta.label}
                                        </span>
                                    </td>
                                )}
                                <td style={{ color: 'rgba(255,255,255,0.5)' }}>{new Date(c.updatedAt).toLocaleDateString('ar')}</td>
                                <td>
                                    <button className="btn-primary" onClick={() => onSelect(c._id)}>
                                        {showStatus ? 'معاينة وإدارة' : 'معاينة ومراجعة'}
                                    </button>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    )
}