import type { InstructorCourse } from '../../../services/courseService'
import { getCourseCoverUrl, PLACEHOLDER_IMAGE, handleImageFallback } from '../../../utils/imageUtils'

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
    draft: { label: 'مسودة', color: '#94a3b8' },
    pending_review: { label: 'قيد المراجعة', color: '#f59e0b' },
    published: { label: 'منشور', color: '#10b981' },
    rejected: { label: 'مرفوض', color: '#ef4444' },
    suspended: { label: 'موقوف', color: '#f59e0b' },
    archived: { label: 'مؤرشف', color: '#64748b' },
}

interface Props {
    courses: InstructorCourse[]
    selectedId: string | null
    onSelect: (courseId: string) => void
    onCreateClick: () => void
    onPreview: (courseId: string) => void
}

export function CourseListPanel({ courses, selectedId, onSelect, onCreateClick, onPreview }: Props) {
    if (courses.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'rgba(255,255,255,0.35)' }}>
                <div style={{ fontSize: 48, marginBottom: 14 }}>📝</div>
                <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>لا توجد كورسات بعد</div>
                <button className="btn-primary" style={{ padding: '9px 22px', marginTop: 10 }} onClick={onCreateClick}>ابدأ أول كورس</button>
            </div>
        )
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
            {courses.map(c => {
                const statusMeta = STATUS_LABELS[c.status] || STATUS_LABELS.draft
                return (
                    <div
                        key={c._id}
                        onClick={() => onSelect(c._id)}
                        style={{
                            background: 'var(--bg-card)', backdropFilter: 'blur(20px)',
                            border: `1px solid ${selectedId === c._id ? 'rgba(124,58,237,0.5)' : 'var(--border)'}`,
                            borderRadius: 16, padding: '14px 18px', cursor: 'pointer', display: 'flex', gap: 14, alignItems: 'center',
                        }}
                    >
                        <img
                            src={getCourseCoverUrl(c._id) || PLACEHOLDER_IMAGE}
                            alt={c.title}
                            style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 10, flexShrink: 0 }}
                            onError={handleImageFallback}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{c.title}</div>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                                <span className="badge" style={{ background: `${statusMeta.color}22`, color: statusMeta.color, border: `1px solid ${statusMeta.color}44` }}>
                                    {statusMeta.label}
                                </span>
                                <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.45)' }}>👥 {c.enrolledCount ?? 0} طالب</span>
                                {c.rejection_reason && c.status !== 'published' && (
                                    <span style={{ fontSize: 12, color: '#f87171' }}>❌ {c.rejection_reason}</span>
                                )}
                            </div>
                        </div>
                        <button
                            className="btn-outline" style={{ padding: '6px 14px', fontSize: 12, flexShrink: 0 }}
                            onClick={e => { e.stopPropagation(); onPreview(c._id) }}
                        >
                            👁 معاينة
                        </button>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 16, flexShrink: 0 }}>
                            {selectedId === c._id ? '▲' : '←'}
                        </span>                    </div>
                )
            })}
        </div>
    )
}