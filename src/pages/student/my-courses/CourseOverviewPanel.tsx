import type { Enrollment } from '../../../services/courseService'
import { getCourseCoverUrl, PLACEHOLDER_IMAGE, handleImageFallback } from '../../../utils/imageUtils'

interface Props {
    enrollment: Enrollment
    progressPercentage: number
    onBack: () => void
}

export function CourseOverviewPanel({ enrollment, progressPercentage, onBack }: Props) {
    const course = enrollment.course_id
    return (
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
            <button
                onClick={onBack}
                style={{ background: 'none', border: 'none', color: '#a855f7', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, display: 'flex', alignItems: 'center', gap: 6, padding: 0, marginBottom: 20 }}
            >
                ← العودة لكورساتي
            </button>

            <div style={{ background: 'var(--bg-card)', backdropFilter: 'blur(20px)', border: '1px solid var(--border)', borderRadius: 20, overflow: 'hidden' }}>
                <img
                    src={getCourseCoverUrl(course?._id) || PLACEHOLDER_IMAGE}
                    alt={course?.title}
                    style={{ width: '100%', height: 220, objectFit: 'cover' }}
                    onError={handleImageFallback}
                />
                <div style={{ padding: 28 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>{course?.title}</h2>
                    <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, marginBottom: 20 }}>{course?.description}</p>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>نسبة التقدّم</span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: '#a855f7' }}>{Math.round(progressPercentage * 100)}%</span>
                    </div>
                    <div className="progress-bar" style={{ marginBottom: 24 }}>
                        <div className="progress-fill" style={{ width: `${progressPercentage * 100}%` }} />
                    </div>

                    <div style={{ background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.25)', borderRadius: 12, padding: '14px 16px', fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>
                        🚧 مشغّل المحتوى الكامل (الدروس، الاختبارات، المراجعة الجماعية) قيد الربط حالياً وسيكون متاحاً قريباً.
                    </div>
                </div>
            </div>
        </div>
    )
}